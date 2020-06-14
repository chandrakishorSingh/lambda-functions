const {marshall, unmarshall, dynamoGetItem} = require('./dynamo');

const FUNDS_TABLE_NAME = 'Funds';

exports.handler = async (event) => {
    const phoneNumber = event.params.querystring.phoneNumber;
    
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: FUNDS_TABLE_NAME });
    const funds = unmarshall(result.data.Item);
    
    // return response
    return { funds: funds['AvailableFunds'] };
};
