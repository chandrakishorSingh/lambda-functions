const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10', region: 'us-east-2' });
const marshall = AWS.DynamoDB.Converter.marshall;
const unmarshall = AWS.DynamoDB.Converter.unmarshall;

// Promise based dynamoDB.putItem operation
const dynamoPutItem = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.putItem(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

// Promise based dynamoDB.scan operation
const dynamoScan = (params) => {
    return new Promise((resolve, reject) => {
        const awsRequest = dynamoDB.scan(params);
        awsRequest.on('success', (res) => resolve(res));
        awsRequest.on('error', (err) => reject(err));
        awsRequest.send();
    });
};

exports.dynamoPutItem = dynamoPutItem;
exports.dynamoScan = dynamoScan;
exports.marshall = marshall;
exports.unmarshall = unmarshall;