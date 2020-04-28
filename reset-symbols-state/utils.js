const AWS = require('aws-sdk');

const { dynamoPutItem, dynamoScan, unmarshall, marshall } = require('./dynamo');

// Table name constants
const SYMBOLS_STATE_TABLE_NAME = 'SymbolsState';

// Returns a map that describes companies whose stock prices have been obtained and whose yet to be obtained.
// It's type is { Description: string, Symbols: { <symbl1>: <boolean>, <symbl2>: <boolean>, <symbl3>: <boolean>, ... } }
const getSymbolsState = async () => {
    const res = await dynamoScan({ TableName: SYMBOLS_STATE_TABLE_NAME });
    return unmarshall(res.data.Items[0]);
};

// Makes all the state of all stocks as false. This happens after the market is been closed for the day.
const resetSymbolsState = async (symbolsState) => {
    for (let symbol in symbolsState.Symbols) {
        symbolsState.Symbols[symbol] = false;
    }
    await dynamoPutItem({ Item: marshall(symbolsState), TableName: SYMBOLS_STATE_TABLE_NAME });
};

exports.getSymbolsState = getSymbolsState;
exports.resetSymbolsState = resetSymbolsState;