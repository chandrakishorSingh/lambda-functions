const {dynamoScan, dynamoPutItem, unmarshall, marshall} = require('./dynamo');

const NOTIFICATIONS_TABLE_NAME = 'Notifications';

exports.handler = async (event) => {
    
    // get all users
    const usersResult = await dynamoScan({ TableName: NOTIFICATIONS_TABLE_NAME });
    const users = usersResult.data.Items.map(item => unmarshall(item));
    
    // make the Notifications attr. empty arr and store the updated obj
    for (const user of users) {
        user['Notifications'] = [];
        await dynamoPutItem({ Item: marshall(user), TableName: NOTIFICATIONS_TABLE_NAME });
    }
    
};
