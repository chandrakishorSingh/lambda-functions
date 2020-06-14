const {dynamoGetItem, marshall, unmarshall, dynamoPutItem} = require('./dynamo');
const {PortfolioItem} = require('./models');
const {toFixed} = require('./utils');

const PORTFOLIO_TABLE_NAME = 'Portfolio';

exports.handler = async (event) => {
    // logging purpose
    // console.log('event is ', event);
    
    // extract the order data
    const { Symbol, SignalType, Quantity, Price, TradeAmount, CreatedAt } = event['order'];
    const phoneNumber = event['phoneNumber'];
    
    // get the portfolio object from db
    const result = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: PORTFOLIO_TABLE_NAME });
    const portfolio = unmarshall(result.data.Item);
    
    // check the signal type(buy | sell) and update portfolio accordingly
    if (SignalType === 'buy') {
        // find the portfolio item for the corresponding symbol and update it's info.
        // in case this is a new stock in the portfolio, then add it to arr of portfolio items.
        const portfolioItem = portfolio['Portfolio'].find(item => item['Symbol'] === Symbol);
        if (portfolioItem) {
            const newQuantity = Quantity + portfolioItem['Quantity'];
            const totalInvestment = toFixed(portfolioItem['TotalInvestment'] + Quantity * Price);
            const newAvgPrice = toFixed(totalInvestment / newQuantity);
            
            const updatedPortfolioItem = new PortfolioItem(Symbol, newQuantity, newAvgPrice);
            const oldPortfolioItemIndex = portfolio['Portfolio'].findIndex(item => item['Symbol'] === Symbol);
            portfolio['Portfolio'].splice(oldPortfolioItemIndex, 1, updatedPortfolioItem);
        } else {
            const portfolioItem = new PortfolioItem(Symbol, Quantity, Price);
            portfolio['Portfolio'].push(portfolioItem);
        }
    } else {
        // as it is a sell order, subtract the number of stocks specified by the `Quantity` variable
        const portfolioItem = portfolio['Portfolio'].find(item => item['Symbol'] === Symbol);
        const newQuantity = portfolioItem['Quantity'] - Quantity;
        const newTotalInvestment = portfolioItem['TotalInvestment'] - toFixed(Quantity * portfolioItem['AvgPrice']);
        portfolioItem['Quantity'] = newQuantity;
        portfolioItem['TotalInvestment'] = newTotalInvestment;
    }
    
    
    // store the updated portfolio
    await dynamoPutItem({ Item: marshall(portfolio), TableName: PORTFOLIO_TABLE_NAME });
};
