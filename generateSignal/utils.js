const {Signal} = require('./models');
const { dynamoPutItem, dynamoGetItem, marshall, unmarshall } = require('./dynamo');

// Constants describing table names
const SIGNALS_TABLE_NAME = 'Signals';
const SIGNAL_HISTORY_TABLE_NAME = 'SignalHistory';

// returns average of numbers given in arr
const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// A function to calculate 14-period RSI. It requires 15 data points
const rsi = (currentPrice, previousClosePrice, previousGainEWMA, previousLossEWMA) => {
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
};

const stochasticRsi = (rsiArr) => {
    const currentRsi = rsiArr[rsiArr.length - 1];
    const lowestRsi = Math.min(...rsiArr);
    const highestRsi = Math.max(...rsiArr);
    let currentStochasticRsi = (currentRsi - lowestRsi) / (highestRsi - lowestRsi);
    if (Number.isNaN(currentStochasticRsi)) {
        currentStochasticRsi = 100;
    }
    
    return currentStochasticRsi;
};

const fastK = (stochasticRsiArr) => average(stochasticRsiArr);

const calculateStockDetails = (stock, previousStockDetails) => {
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
};

const calculateFastD = (fastKArr) => average(fastKArr);

// Determines whether to buy, sell or no action
const calculateSignalType = (fastK, fastD) => {
    return fastK > fastD ? 'buy' : 'sell';
};

// Saves the buy/sell signal to Signals table
const saveSignal = (symbol, signalType, fastD, fastK, date, price) => {
    const signal = new Signal(symbol, date, fastD, fastK, signalType, price);
    return dynamoPutItem({ Item: marshall(signal), TableName: SIGNALS_TABLE_NAME });
};

// fetches the stock details from SignalHistory table for the specified symbol
const getPreviousStockDetails = async (symbol) => {
    const result = await dynamoGetItem({ Key: marshall({ Symbol: symbol }), TableName: SIGNAL_HISTORY_TABLE_NAME });
    console.log(unmarshall(result.data.Item));
    return unmarshall(result.data.Item);
};

const saveCurrentStockDetails = async (currentStockDetails) => {
    return dynamoPutItem({ Item: marshall(currentStockDetails), TableName: SIGNAL_HISTORY_TABLE_NAME });
};

// A promise based settimeout
const wait = (timeInMs) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeInMs);
    });
};

exports.stochasticRsi = stochasticRsi;
exports.calculateSignalType = calculateSignalType;
exports.saveSignal = saveSignal;
exports.wait = wait;
exports.getPreviousStockDetails = getPreviousStockDetails;
exports.calculateStockDetails = calculateStockDetails;
exports.calculateFastD = calculateFastD;
exports.saveCurrentStockDetails = saveCurrentStockDetails;