const {Signal} = require('./models');

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: 'us-east-2' });
const marshall = AWS.DynamoDB.Converter.marshall;

// Constants describing table names
const SIGNALS_TABLE_NAME = 'Signals';

// Promise based dynamoDB.putItem operation
const dynamoPutItem = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.putItem(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

// A promise based settimeout
const wait = (timeInMs) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeInMs);
    });
};

// A function to calculate 14-period RSI. It requires 15 data points
const rsi = (dataPoints) => {
    // calculate consecutive changes in data points
    const changes = [];
    for (let i = 1; i < 15; i++) {
        changes.push(dataPoints[i] - dataPoints[i - 1]);
    }

    // filter out gains and losses
    const gains = changes.filter((gain) => gain >= 0);
    const losses = changes.filter((loss) => loss < 0);

    // calculate avg. gain and avg. loss
    const avgGain = gains.reduce((a, b) => a + b, 0) / 14;
    const avgLoss = losses.map((loss) => Math.abs(loss)).reduce((a, b) => a + b, 0) / 14;

    // calculate RS and then RSI. in case avg. loss is zero, divide by zero occurs for RS. in such case RSI is 100 by definition.
    let rsi = 100;
    if (avgLoss !== 0) {
        const rs = avgGain / avgLoss;
        // console.log(rs);
        rsi = 100 - (100 / (1 + rs));
    }
    // console.log(rsi);
    return rsi;
};

/* A function to calculate Stochastic RSI FastK and FastD for 14 period.
/* First Stochastic RSI requires 28 data points.
/* First FastK requires 30 data points.
/* First FastD requires 32 data points.
*/
const stochasticRsi = (dataPoints) => {
    // calculate last 18 RSI
    const rsiArr = [];
    for (let i = 0; i < 18; i++) {
        rsiArr.push(rsi(dataPoints.slice(i, i + 15)));
    }
    console.log('rsiArr', rsiArr);

    // calculate last 5 Stochastic RSI using highest, lowest and current RSI for 1-14, 2-15, 3-16, 4-17, 5-18 period RSI.
    const stochasticRsiArr = [];
    for (let i = 0; i < 5; i++) {
        const last14Rsi = rsiArr.slice(i, i + 14);
        const currentRsi = last14Rsi[last14Rsi.length - 1];
        const lowestRsi = Math.min(...last14Rsi);
        const highestRsi = Math.max(...last14Rsi);
        let currentStochasticRsi = (currentRsi - lowestRsi) / (highestRsi - lowestRsi);
        if (Number.isNaN(currentStochasticRsi)) {
            currentStochasticRsi = 100;
        }
        stochasticRsiArr.push(currentStochasticRsi);
    }
    console.log('stochasticRsiArr', stochasticRsiArr);

    // calculate last 3 FastK values and current FastK
    const fastkArr = [];
    for (let i = 0; i < 3; i++) {
        const last3StochasticRsi = stochasticRsiArr.slice(i, i + 3);
        const last3StochasticRsiAvg = last3StochasticRsi.reduce((a, b) => a + b, 0) / 3;
        fastkArr.push(last3StochasticRsiAvg);
    }
    const currentFastk = round(fastkArr[fastkArr.length - 1]);
    console.log('fastkArr', fastkArr);

    // calculate current FastD
    const currentFastd = round(fastkArr.reduce((a, b) => a + b, 0) / 3);

    return { currentFastk, currentFastd };
};

// Rounds the number to specified number of significant digits(or to 8, in case it is not specified)
const round = (n, digits = 8) => Number(n.toPrecision(digits));

// Cleans the data came from get-stock-prices to calculate Stochastic RSI
const cleanData = (data) => {
    return data.map(item => {
        return {
            ...item,
            data: item.data.map(stockPrice => {
                return { ...stockPrice, date: new Date(stockPrice.date) };
            })
        };
    });
    
};

// Determines whether to buy, sell or no action
const calculateSignalType = (fastK, fastD) => {
    return fastK > fastD ? 'buy' : 'sell';
};

// Saves the buy | sell signal to Signals table
const saveSignal = (symbol, signalType, fastD, fastK, signalTime, signalPrice) => {
    const signal = new Signal(symbol, signalType, fastD, fastK, signalTime, signalPrice);
    return dynamoPutItem({ Item: marshall(signal), TableName: SIGNALS_TABLE_NAME });
};

exports.stochasticRsi = stochasticRsi;
exports.cleanData = cleanData;
exports.calculateSignalType = calculateSignalType;
exports.saveSignal = saveSignal;
exports.wait = wait;