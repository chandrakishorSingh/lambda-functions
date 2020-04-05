const { cleanData, stochasticRsi, calculateSignalType, saveSignal, wait } = require('./utils');

exports.handler = async (event, context) => {
    
    // iterate over all 5 stocks
    const historicalStockPrices5 = cleanData(event);
    for (let stock of historicalStockPrices5) {
        // calculate the signalType(buy | sell)
        const symbol = stock.symbol;
        const { currentFastk: fastK, currentFastd: fastD } = stochasticRsi(stock.data.map(item => item.price));
        const signalType = calculateSignalType(fastK, fastD);
        
        // logging purpose
        console.log(stock.symbol, ' ', stock.data.length);
        console.log('typeof', typeof (stock.data[0].date));
        console.log(stock.data);
        console.log(stock.data[stock.data.length - 1]);
        
        const signalTime = stock.data[stock.data.length - 1].date.getTime();
        const signalPrice = stock.data[stock.data.length - 1].price;
        await saveSignal(symbol, signalType, fastD, fastK, signalTime, signalPrice);
        
        await wait(1500);
    }
};