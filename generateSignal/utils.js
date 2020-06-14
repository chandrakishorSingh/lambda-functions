const {Signal} = require('./models');
const { dynamoPutItem, dynamoGetItem, dynamoQuery, marshall, unmarshall } = require('./dynamo');

// Constants describing table names
const SIGNALS_TABLE_NAME = 'Signals';
const SIGNAL_HISTORY_TABLE_NAME = 'SignalHistory';

// returns average of numbers given in arr
function average (arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// gives a string repr. of given number with padding of zeros from left
function padNumber(num, len) {
    if (num.toString().length < len) {
        let result = '';
        for (let i = 0; i < len - num.toString().length; i++) {
            result += '0';
        }
        return result + num.toString();
    }
    return num.toString();
}

// formats the date obj in YYYY-MM-DD format
function formatDate(date) {
    return [date.getFullYear().toString(), padNumber(date.getMonth() + 1, 2), padNumber(date.getDate(), 2)].join('-');
}

// A function to calculate 14-period RSI. It requires 15 data points
function rsi(currentPrice, previousClosePrice, previousGainEWMA, previousLossEWMA) {
    const change = currentPrice - previousClosePrice;
    let up = 0, down = 0;
    change > 0 ? up = change : down = Math.abs(change);

    // calculate gainEWMA and lossEWMA
    const gainEWMA = (previousGainEWMA * 13 + up) / 14;
    const lossEWMA = (previousLossEWMA * 13 + down) / 14;

    // calculate RS and then RSI. in case lossEWMA is zero, divide by zero occurs for RS. in such case RSI is 100 by definition.
    let rsi = 100;
    if (lossEWMA !== 0) {
        const rs = gainEWMA / lossEWMA ;
        // console.log(rs);
        rsi = 100 - (100 / (1 + rs));
    }
    // create rsiData obj
    const rsiData = { rsi, gainEWMA ,lossEWMA };
    return rsiData;
}

function stochasticRsi(rsiArr) {
    const currentRsi = rsiArr[rsiArr.length - 1];
    const lowestRsi = Math.min(...rsiArr);
    const highestRsi = Math.max(...rsiArr);
    let currentStochasticRsi = (currentRsi - lowestRsi) / (highestRsi - lowestRsi);
    if (Number.isNaN(currentStochasticRsi)) {
        currentStochasticRsi = 100;
    }
    
    return currentStochasticRsi;
}

function fastK(stochasticRsiArr) {
    return average(stochasticRsiArr);

}

function calculateStockDetails(stock, previousStockDetails) {
    // calculate rsi
    const rsiData = rsi(stock.price, previousStockDetails.ClosePrice, previousStockDetails.GainEWMA, previousStockDetails.LossEWMA);
    // calculate stochastic rsi
    const currentStochasticRsi = stochasticRsi([...previousStockDetails.RsiArr, rsiData.rsi]);
    // calculate fastK
    const currentFastK = fastK([...previousStockDetails.StochRsiArr, currentStochasticRsi]);
    // create currentStockDetails obj and return 
    const currentStockDetails = {};
    currentStockDetails.ClosePrice = stock.price;
    currentStockDetails.FastkArr = [...previousStockDetails.FastkArr.slice(1), currentFastK];
    currentStockDetails.GainEWMA = rsiData.gainEWMA;
    currentStockDetails.LossEWMA = rsiData.lossEWMA;
    currentStockDetails.RsiArr = [...previousStockDetails.RsiArr.slice(1), rsiData.rsi];
    currentStockDetails.StochRsiArr = [...previousStockDetails.StochRsiArr.slice(1), currentStochasticRsi];
    currentStockDetails.Symbol = previousStockDetails.Symbol;
    currentStockDetails.CloseDate = stock.date;
    return currentStockDetails;
}

function calculateFastD(fastKArr) {
    return average(fastKArr);
}

// Determines whether to buy, sell or no action
function calculateSignalType(fastK, fastD) {
    return fastK > fastD ? 'buy' : 'sell';
}

// Saves the buy/sell signal to Signals table
function saveSignal(symbol, signalType, fastD, fastK, date, price) {
    const signal = new Signal(symbol, date, fastD, fastK, signalType, price);
    return dynamoPutItem({ Item: marshall(signal), TableName: SIGNALS_TABLE_NAME });
}

// fetches the stock details from SignalHistory table for the specified symbol
async function getPreviousStockDetails (symbol) {
    const result = await dynamoGetItem({ Key: marshall({ Symbol: symbol }), TableName: SIGNAL_HISTORY_TABLE_NAME });
    console.log(unmarshall(result.data.Item));
    return unmarshall(result.data.Item);
}

async function saveCurrentStockDetails(currentStockDetails) {
    return dynamoPutItem({ Item: marshall(currentStockDetails), TableName: SIGNAL_HISTORY_TABLE_NAME });
}

async function getLatestSignalBySymbol(symbol) {
    const dateString = formatDate(new Date());

    const params = {
        TableName: SIGNALS_TABLE_NAME,
        KeyConditionExpression: '#Symbol = :v1 AND #CreatedAt <= :v2',
        ExpressionAttributeValues: marshall({ ':v1': symbol, ':v2' : dateString }),
        ExpressionAttributeNames: {
            '#CreatedAt': 'CreatedAt',
            '#Symbol': 'Symbol'
        },
        Limit: 1,
        ScanIndexForward: false
    };
    const result = await dynamoQuery(params).catch(err => console.log(err));

    return unmarshall(result.data.Items[0]);
    // return result;
}


exports.stochasticRsi = stochasticRsi;
exports.calculateSignalType = calculateSignalType;
exports.saveSignal = saveSignal;
exports.getPreviousStockDetails = getPreviousStockDetails;
exports.calculateStockDetails = calculateStockDetails;
exports.calculateFastD = calculateFastD;
exports.saveCurrentStockDetails = saveCurrentStockDetails;
exports.getLatestSignalBySymbol = getLatestSignalBySymbol;