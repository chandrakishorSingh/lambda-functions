const {dynamoGetItem, marshall, unmarshall} = require('./dynamo');
const {isObjectEmpty} = require('./utils');

const USERS_TABLE_NAME = 'Users';

exports.handler = async (event, context, z) => {
    // extract the phone number
    const phoneNumber = event.params.querystring.phoneNumber;
    
    // // return the user having the given phone number. if there is no such user then communicate it.
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: USERS_TABLE_NAME });
    const user = unmarshall(result.data.Item);
    
    if (isObjectEmpty(user)) {
        return Promise.resolve({ message: `No user found for ${phoneNumber}`});
    } else {
        return Promise.resolve({ user });
    }
};
