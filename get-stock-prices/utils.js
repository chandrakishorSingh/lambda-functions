const https = require('https');

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' });
const unmarshall = AWS.DynamoDB.Converter.unmarshall;
const marshall = AWS.DynamoDB.Converter.marshall;
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

const {StockPrice} = require('./models');

// constants describing the type of time series
const TS_60MIN = 'ts-60min';
const TS_DAILY = 'ts-daily';

// Table name constants
const SYMBOLS_STATE_TABLE_NAME = 'SymbolsState';
const STOCK_PRICES_TABLE_NAME = 'StockPrices';

// Lambda ARNs
const GENERATE_SIGNAL_LAMBDA_ARN = 'arn:aws:lambda:us-east-2:273062589977:function:generateSignal';

// A promise based https GET request.
const getHttps = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let result = '';
            res.on('data', (chunk) => { result += chunk; });
            res.on('end', () => { resolve(JSON.parse(result)); });
        }).on('error', (err) => { reject(err); });
    });
};

// A function to generate API endpoint by configuring the query params.
const getApiEndPoint = (symbol, tsType) => {
    switch (tsType) {
        case TS_60MIN:
            return `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=NSE:${escape(symbol)}&interval=60min&outputsize=full&apikey=FH3ST1MUI6674SCQ`;
        case TS_DAILY:
            return `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=NSE:${escape(symbol)}&outputsize=full&apikey=FH3ST1MUI6674SCQ`;
    }
};

// A promise based settimeout
const wait = (timeInMs) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeInMs);
    });
};

// Cleans the response of Time Series 60min data. This API gives price of stock at 9:15, 10:15, 11:15, 12:15, 13:15, 14:15, 15:15
// Also it gives stock price at the current time. Remove the price at current time as it might not be 1h away from previous one.
// US/Eastern is 9:30 hour behind of IST.
const cleanResponseTimeSeries60min = (response) => {

    const targetPropNameData = 'Time Series (60min)';
    const symbol = (response['Meta Data']['2. Symbol']).split(':')[1];
    const stockPriceData = response[targetPropNameData];

    // clean the data to get the latest 30 prices(in the interval of 60min)
    const stockPrices = Object.keys(stockPriceData).map((dateString) => {
        const [dayString, timeString] = dateString.split(' ');
        const dayData = dayString.split('-').map(item => parseInt(item, 10));
        const timeData = timeString.split(':');
        const date = new Date(dayData[0], dayData[1] - 1, dayData[2], timeData[0], timeData[1], timeData[2]);
        return new StockPrice(symbol, date, Number(stockPriceData[dateString]['4. close']));
        // return { date, price: Number(stockPriceData[dateString]['4. close']) };
    }).filter((item) => item.date.getMinutes() === 45)
    .sort((a, b) => {
        return a.date > b.date ? -1: 1;
    });

    return stockPrices;
};

// Cleans the response of Time Series Daily
const cleanResponseTimeSeriesDaily = (data) => {
    const propName = 'Time Series (Daily)';
    const stockPriceData = data[propName];

    // clean the data and returns an array of stock prices
    const stockPrices = Object.keys(stockPriceData).map((dayString) => {
        const dayData = dayString.split('-').map(item => parseInt(item, 10));
        const date = new Date(dayData[0], dayData[1] - 1, dayData[2]);
        return { date, price: Number(stockPriceData[dayString]['4. close']) };
    }).sort((a, b) => {
        return a.date > b.date ? -1: 1;
    });

    return stockPrices;
};

// A function which returns the asked 'clean response' functions
const cleanResponseFunctions = (funcName) => {
    switch (funcName) {
        case TS_60MIN:
            return cleanResponseTimeSeries60min;
        case TS_DAILY:
            return cleanResponseTimeSeriesDaily;
    }
};

// A function that cleans the data given by API. Gives an arr of last 32 prices of stock in the interval specified by cleanResponseFuncName
const cleanResponse = (data, cleanResponseFuncName) => {
    return cleanResponseFunctions(cleanResponseFuncName)(data).slice(0, 32).reverse();
};

// A function that gets the prices of specified stock from API.
const getStockPrices = async (symbol, tsType) => {
    const apiEndPoint = getApiEndPoint(symbol, tsType);
    return cleanResponse(await getHttps(apiEndPoint), tsType);
};

// Promise based dynamoDB.scan operation
const dynamoScan = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.scan(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

// Promise based dynamoDB.putItem operation
const dynamoPutItem = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.putItem(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

// Returns a map that describes companies whose stock prices have been obtained and whose yet to be obtained.
// It's type is { Description: string, Symbols: { <symbl1>: <boolean>, <symbl2>: <boolean>, <symbl3>: <boolean>, ... } }
const getSymbolsState = async () => {
    const res = await dynamoScan({ TableName: SYMBOLS_STATE_TABLE_NAME });
    return unmarshall(res.data.Items[0]);
};

// Makes all the state of all stocks as false. This happens at the end of a single extraction cycle
const resetSymbolsState = async (symbolsState) => {
    for (let symbol in symbolsState.Symbols) {
        symbolsState.Symbols[symbol] = false;
    }
    await dynamoPutItem({ Item: marshall(symbolsState), TableName: SYMBOLS_STATE_TABLE_NAME });
};

// A function that determines the next 5 companies whose stock prices have to be obtained.
const getCurrentSymbols = async (symbolsState) => {
    const currentSymbols = Object.keys(symbolsState.Symbols)
    .sort((a, b) => a.localeCompare(b))
    .filter((symbol) => !symbolsState.Symbols[symbol])
    .slice(0, 5);
    
    // reset all stock's state if this is the begining of new cycle
    if (currentSymbols.length === 0) {
        await resetSymbolsState(symbolsState);
        const newSymbolsState = await getSymbolsState();
        return getCurrentSymbols(newSymbolsState);
    }
    return currentSymbols;
};

const updateSymbolsState = async (currentSymbols, symbolsState) => {
    for (let symbol of currentSymbols) {
        symbolsState.Symbols[symbol] = true;
    }
    await dynamoPutItem({ Item: marshall(symbolsState), TableName: SYMBOLS_STATE_TABLE_NAME });
};

const storeLatestPrices = async (latestStockPrices) => {
    for (let stockPrice of latestStockPrices) {
        const item = { Symbol: stockPrice.symbol, Time: stockPrice.date.getTime(), Price: stockPrice.price };
        await dynamoPutItem({ Item: marshall(item), TableName: STOCK_PRICES_TABLE_NAME });
    }
};

const callLambda = (funcName, invocationType, logType, payload) => {
    const params = {
        FunctionName: funcName,
        InvocationType: invocationType,
        LogType: logType,
        Payload: payload
    };
    const awsRequest = lambda.invoke(params);
    return new Promise((resolve, reject) => {
        awsRequest.on('succstoreLatestPricesess', resolve);
        awsRequest.on('error', reject);
        awsRequest.send();
    });
};

const callGenerateSignalLambda = async (historicalStockPrices) => {
    await callLambda(GENERATE_SIGNAL_LAMBDA_ARN, 'Event', 'None', JSON.stringify(historicalStockPrices));
};

exports.getStockPrices = getStockPrices;
exports.TS_60MIN = TS_60MIN;
exports.TS_DAILY = TS_DAILY;
exports.getSymbolsState = getSymbolsState;
exports.wait = wait;
exports.getCurrentSymbols = getCurrentSymbols;
exports.resetSymbolsState = resetSymbolsState;
exports.getApiEndPoint = getApiEndPoint;
exports.getHttps = getHttps;
exports.cleanResponse = cleanResponse;
exports.updateSymbolsState = updateSymbolsState;
exports.storeLatestPrices = storeLatestPrices;
exports.callGenerateSignalLambda = callGenerateSignalLambda;