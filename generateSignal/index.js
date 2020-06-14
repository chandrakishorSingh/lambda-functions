const {
    calculateSignalType,
    saveSignal,
    getPreviousStockDetails,
    calculateStockDetails,
    saveCurrentStockDetails,
    calculateFastD,
    getLatestSignalBySymbol
} = require('./utils');

exports.handler = async (event, context) => {
    
    // iterate over all 5 stocks
    const stocks = event;
    for (let stock of stocks) {
        const symbol = stock.symbol;
        // fetch previous stock details
        const previousStockDetails = await getPreviousStockDetails(symbol);
        // calculate current stock details
        const currentStockDetails = calculateStockDetails(stock, previousStockDetails);
        // calculate fastK and fastD
        const fastK = currentStockDetails.FastkArr[currentStockDetails.FastkArr.length - 1];
        const fastD = calculateFastD([
            ...previousStockDetails.FastkArr,
            fastK
        ]);
        
        // save the current stock details
        await saveCurrentStockDetails(currentStockDetails);

        // determine the signal type
        const signalType = calculateSignalType(fastK, fastD);
        
        // get the previous signal for the current symbol
        const previousSignal = await getLatestSignalBySymbol(symbol);
        // save the signal only if this is opposite of previous signal type. otherwise if this is the first signal for 
        // the symbol then store it anyway
        if (Object.keys(previousSignal).length === 0 && signalType === 'buy') {
            await saveSignal(symbol, signalType, fastD, fastK, stock.date, stock.price);
        } else if (previousSignal['SignalType'] !== signalType && Object.keys(previousSignal).length > 0) {
            await saveSignal(symbol, signalType, fastD, fastK, stock.date, stock.price);
        }
    }
};

