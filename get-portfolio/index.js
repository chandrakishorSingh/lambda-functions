const {dynamoGetItem, marshall, unmarshall} = require('./dynamo');
const {formatDate, getLTP, getPreviousLTP, toFixed} = require('./utils');

const USERS_TABLE_NAME = 'Users';
const PORTFOLIO_TABLE_NAME = 'Portfolio';

exports.handler = async (event) => {
    // get the user data from Users table via the phone number present in event
    const phoneNumber = event.params.querystring.phoneNumber;

    // get the portfolio of via phone number
    const portfolioResult = await dynamoGetItem({ Key: marshall({ PhoneNumber: phoneNumber }), TableName: PORTFOLIO_TABLE_NAME });
    const portfolio = unmarshall(portfolioResult.data.Item);
    
    // calculate the required prop. for each portfolio item : LTP, P&L, DayP&L, CurrentValue
    const res = [];
    for (let item of portfolio['Portfolio']) {
        const ltp = toFixed(await getLTP(item['Symbol']));
        const previousLtp = toFixed(await getPreviousLTP(item['Symbol']));
        
        const currentValue = toFixed(item['Quantity'] * ltp);
        const pal = toFixed(currentValue - item['TotalInvestment']);
        const palPercentage = toFixed(pal / item['TotalInvestment']) * 100;
        const dayPal = toFixed(item['Quantity'] * (ltp - previousLtp));
        
        res.push({
            ...item,
            CurrentValue: currentValue,
            LatestPrice: ltp,
            ProfitLoss: pal,
            ProfitLossPercentage: palPercentage,
            DayProfitLoss: dayPal
        });
    }
    
    // calculate the portfolio summary
    const currentValue = toFixed(res.map(item => item['CurrentValue']).reduce((a, b) => a + b, 0));
    const totalInvest = toFixed(res.map(item => item['TotalInvestment']).reduce((a, b) => a + b, 0));
    const dayPal = toFixed(res.map(item => item['DayProfitLoss']).reduce((a, b) => a + b, 0));
    const pal = toFixed(res.map(item => item['ProfitLoss']).reduce((a, b) => a + b, 0));
    const palPercentage = totalInvest ? toFixed(pal / totalInvest) * 100 : 0;
    
    const summary = {
        CurrentValue :currentValue,
        TotalInvestment: totalInvest,
        DayPl: dayPal,
        Pl: pal,
        PlPercentage: palPercentage
    };
    
    // return the response
    return {portfolio: res, portfolioSummary: summary };
    
};
