const AWS = require('aws-sdk');
const cisp = new AWS.CognitoIdentityServiceProvider();

async function getUser(accessToken) {
    const params = { AccessToken: accessToken };
    return new Promise((resolve, reject) => {
        const awsRequest = cisp.getUser(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => resolve(err));
        awsRequest.send();
    });
}

exports.getUser = getUser;