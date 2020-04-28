const {
    calculateSignalType,
    saveSignal,
    getPreviousStockDetails,
    calculateStockDetails,
    saveCurrentStockDetails,
    calculateFastD
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
        console.log(currentStockDetails);
        // determine the signal type and save it
        const signalType = calculateSignalType(fastK, fastD);
        await saveSignal(symbol, signalType, fastD, fastK, stock.date, stock.price);
    }
};