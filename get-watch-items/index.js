const {getLTP, getPreviousLTP} = require('./utils');

const STOCK_PRICES_TABLE_NAME = 'StockPrices';

exports.handler = async (event) => {
    
    // get all of the symbols
    const symbols = event['symbols'];
    
    // get the ltp and previous ltp for every symbol
    const watchItems = [];
    for (let symbol of symbols) {
        const latestPrice = await getLTP(symbol);
        const previousPrice = await getPreviousLTP(symbol);
        const change = Number((latestPrice - previousPrice).toString().substr(0, 5));
        const changePercentage = Number(((Math.abs(change) / previousPrice) * 100).toPrecision(2).substr(0, 4));
        watchItems.push({ symbol, latestPrice, previousPrice, change, changePercentage });
    }
    
    return { watchItems };
};
