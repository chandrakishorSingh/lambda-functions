const AWS = require('aws-sdk');
const lambda = new AWS.Lambda({ apiVersion: '2015-03-31' });

const callLambda = (funcName, invocationType, logType, payload) => {
    const params = {
        FunctionName: funcName,
        InvocationType: invocationType,
        LogType: logType,
        Payload: payload
    };
    const awsRequest = lambda.invoke(params);
    return new Promise((resolve, reject) => {
        awsRequest.on('success', resolve);
        awsRequest.on('error', reject);
        awsRequest.send();
    });
};

exports.callLambda = callLambda;

