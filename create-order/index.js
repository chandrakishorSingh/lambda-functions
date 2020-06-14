const {marshall, unmarshall, dynamoGetItem, dynamoPutItem} = require('./dynamo');
const {formatDate, toFixed} = require('./utils');
const {Trade} = require('./models');
const {callLambda} = require('./lambda');

const TRADES_TABLE_NAME = 'Trades';

const UPDATE_PORTFOLIO_LAMBDA_ARN = 'arn:aws:lambda:us-east-2:273062589977:function:update-portfolio';
const UPDATE_FUNDS_LAMBDA_ARN = 'arn:aws:lambda:us-east-2:273062589977:function:update-funds';

exports.handler = async (event) => {
    // get all of the data of order
    const orderData = event;
    
    // get the trade obj from db(this contains all the trades user has done so far)
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: orderData.phoneNumber }), TableName: TRADES_TABLE_NAME });
    const order = unmarshall(result.data.Item);
    
    // check whether this order is not been made for a stock for which an order is already made for the day
    const dateString = formatDate(new Date());
    const symbol = orderData.symbol;
    const isNewOrder = order['Trades'].find(item => item['CreatedAt'] === dateString && symbol === item['Symbol']);
    
    if (isNewOrder) {
        return Promise.resolve({
            statusCode: 403,
            message: 'You have already made an order for the given stock today.',
            title: `Error in placing order` });
    }
    
    // create a trade obj, add it to the global trade obj and store it in trades table
    const { phoneNumber, signalType, quantity, price } = orderData;
    const tradeAmount = toFixed(price * quantity);
    const newOrder = new Trade(symbol, signalType, quantity, price, tradeAmount);
    order['Trades'].push(newOrder);
    
    await dynamoPutItem({ Item: marshall(order), TableName: TRADES_TABLE_NAME });
    
    // call update-portfolio lambda and pass the info. of this new order
    await callLambda(UPDATE_PORTFOLIO_LAMBDA_ARN, 'Event', 'None', JSON.stringify({ order: newOrder, phoneNumber }));
    
    // call update-funds lambda and pass the info. of this new order;
    await callLambda(UPDATE_FUNDS_LAMBDA_ARN, 'Event', 'None', JSON.stringify({ order: newOrder, phoneNumber }));
    
    // return response
    return Promise.resolve({
        statusCode: '200',
        message: `Your order of ${symbol.toUpperCase()} for ${quantity} was placed successfully`,
        title: 'Order Placed!'
    });
};
