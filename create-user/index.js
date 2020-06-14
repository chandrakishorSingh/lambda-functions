const {isObjectEmpty, createUserDataSkeleton} = require('./utils');
const {dynamoGetItem, dynamoPutItem, marshall, unmarshall} = require('./dynamo');
const {User} = require('./models');

const USERS_TABLE_NAME = 'Users';

exports.handler = async (event) => {
    // extract the users data
    const userData = event;

    // return if a user with the provided phone number already exists.
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: userData.phoneNumber }), TableName: USERS_TABLE_NAME });
    const existingUser = unmarshall(result.data.Item);

    if (!isObjectEmpty(existingUser)) {
        return { message: 'User already exists.' };
    }
    
    // create new user obj and store it in DB
    const user = new User(userData.firstName, userData.lastName, userData.email, userData.phoneNumber);
    await dynamoPutItem({ Item: marshall(user), TableName: USERS_TABLE_NAME });
    
    // create empty user data skeleton in required DBs
    await createUserDataSkeleton(userData.phoneNumber);
    
    // send response of new user creation
    return Promise.resolve({ message: 'User Created Successfully!', user });
};
