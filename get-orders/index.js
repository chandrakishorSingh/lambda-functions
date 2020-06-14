const {marshall, unmarshall, dynamoGetItem} = require('./dynamo');

const TRADES_TABLE_NAME = 'Trades';

exports.handler = async (event) => {
    const phoneNumber = event.params.querystring.phoneNumber;
    
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: TRADES_TABLE_NAME });
    const orders = unmarshall(result.data.Item);
    
    return {trades: orders['Trades'] };
};
