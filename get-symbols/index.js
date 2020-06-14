const { dynamoScan, unmarshall } = require('./dynamo');

const SYMBOLS_STATE_TABLE_NAME = 'SymbolsState';

exports.handler = async (event) => {
    const response = await dynamoScan({ TableName: SYMBOLS_STATE_TABLE_NAME });
    const symbols = Object.keys(unmarshall(response['data']['Items'][0])['Symbols']);
    return { symbols };
};
