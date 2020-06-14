const {marshall, unmarshall, dynamoGetItem} = require('./dynamo');
const {getLTP} = require('./utils');

const NOTIFICATIONS_TABLE_NAME = 'Notifications';

exports.handler = async (event) => {
    const phoneNumber = event.params.querystring.phoneNumber;
    // const phoneNumber = '+919579215411';
    
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: NOTIFICATIONS_TABLE_NAME });
    const notifications = unmarshall(result.data.Item);
    
    // return response
    return { notifications };
};
