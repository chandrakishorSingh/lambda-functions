const {dynamoPutItem, marshall} = require('./dynamo');

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

// checks if object is empty(ignoring prop. that have symbol as key)
function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

async function createUserDataSkeleton(phoneNumber) {
    const dbDataMapArr = [
        {
            tableName: 'Funds',
            data: {PhoneNumber: phoneNumber, AvailableFunds: 0 },
        },
        {
            tableName: 'Notifications',
            data: {PhoneNumber: phoneNumber, Notifications: [] },
        },
        {
            tableName: 'Portfolio',
            data: {PhoneNumber: phoneNumber, Portfolio: [] },
        },
        {
            tableName: 'Trades',
            data: {PhoneNumber: phoneNumber, Trades: [] },
        }
    ];
    
    for (let item of dbDataMapArr) {
        await dynamoPutItem({ Item: marshall(item.data), TableName: item.tableName });
    }
}


exports.formatDate = formatDate;
exports.isObjectEmpty = isObjectEmpty;
exports.createUserDataSkeleton = createUserDataSkeleton;