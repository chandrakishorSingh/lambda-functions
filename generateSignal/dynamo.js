const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-2', apiVersion: '2012-08-10' });
const unmarshall = AWS.DynamoDB.Converter.unmarshall;
const marshall = AWS.DynamoDB.Converter.marshall;

// Promise based dynamoDB.scan operation
const dynamoScan = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.scan(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

// Promise based dynamoDB.putItem operation
const dynamoPutItem = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.putItem(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

// Promise based dynamoDB.getItem operation
const dynamoGetItem = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.getItem(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

exports.dynamoScan = dynamoScan;
exports.dynamoPutItem = dynamoPutItem;
exports.dynamoGetItem = dynamoGetItem;
exports.unmarshall = unmarshall;
exports.marshall = marshall;