const {dynamoQuery, marshall, unmarshall} = require('./dynamo');

const STOCK_PRICES_TABLE_NAME = 'StockPrices';

// gives a string repr. of given number with padding of zeros from left
function padNumber(num, len) {
    if (num.toString().length < len) {
        let result = '';
        for (let i = 0; i < len - num.toString().length; i++) {
            result += '0';
        }
        return result + num.toString();
    }
    return num.toString();
}

// formats the date obj in YYYY-MM-DD format
function formatDate(date) {
    return [date.getFullYear().toString(), padNumber(date.getMonth() + 1, 2), padNumber(date.getDate(), 2)].join('-');
}


// gives the ltp of the given symbol
async function getLTP(symbol) {
    const dateString = formatDate(new Date());

    const params = {
        TableName: STOCK_PRICES_TABLE_NAME,
        KeyConditionExpression: '#Symbol = :v1 AND #Date <= :v2',
        ExpressionAttributeValues: marshall({ ':v1': symbol, ':v2' : dateString }),
        ExpressionAttributeNames: {
            '#Date': 'Date',
            '#Symbol': 'Symbol'
        },
        Limit: 1,
        ScanIndexForward: false
    };
    const result = await dynamoQuery(params).catch(err => console.log(err));

    return unmarshall(result.data.Items[0]).Price;
}

exports.getLTP = getLTP;

