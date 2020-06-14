const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' });
const unmarshall = AWS.DynamoDB.Converter.unmarshall;

// Promise based dynamoDB.scan operation
const dynamoScan = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.scan(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

exports.dynamoScan = dynamoScan;
exports.unmarshall = unmarshall;
