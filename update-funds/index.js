const {dynamoGetItem, dynamoPutItem, marshall, unmarshall} = require('./dynamo');
const {toFixed} = require('./utils');

const FUNDS_TABLE_NAME = 'Funds';

exports.handler = async (event) => {
    // extract the order data
    const { Symbol, SignalType, Quantity, Price, TradeAmount, CreatedAt } = event['order'];
    const phoneNumber = event['phoneNumber'];
    
    // get the available funds from db
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: FUNDS_TABLE_NAME });
    const funds = unmarshall(result.data.Item);
    
    // update the funds according to signal type(buy | sell)
    if (SignalType === 'buy') {
        if (TradeAmount >= funds['AvailableFunds']) {
            funds['AvailableFunds'] = 0;
        } else {
            funds['AvailableFunds'] = toFixed(funds['AvailableFunds'] - TradeAmount);
        }
    } else {
        funds['AvailableFunds'] = toFixed(funds['AvailableFunds'] + TradeAmount);
    }
    
    // store the updated funds in db
    await dynamoPutItem({ Item: marshall(funds), TableName: FUNDS_TABLE_NAME });
    
    
};
