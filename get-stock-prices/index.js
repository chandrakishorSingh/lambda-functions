const {
    getStockPrices,
    getSymbolsState,
    getCurrentSymbols,
    updateSymbolsState,
    storeLatestPrices,
    callGenerateSignalLambda,
    wait,
    TS_DAILY,
    TS_60MIN
} = require('./utils');

exports.handler = async (event) => {

    // determine which 5 company's stock prices have to be obtained
    const allSymbolsState = await getSymbolsState();
    let currentSymbols = await getCurrentSymbols(allSymbolsState);
    
    // we are done for the day if all 50 company's stock prices have been obtained
    if (currentSymbols.length === 0) { return; }
    
    // get the stock prices from API of all 5 companies
    const latestStockPrices = [];
    for (let symbol of currentSymbols) {
        const stockPricesData = await getStockPrices(symbol, TS_DAILY);
        latestStockPrices.push({...stockPricesData[stockPricesData.length - 1]});
    }
    
    // for logging purpose
    console.log('latestStockPrices', latestStockPrices);

    // update the SymbolsState table to reflect the changes in the state of current 5 companies
    const updateSymbolsStatePromise = updateSymbolsState(currentSymbols, allSymbolsState);
    
    // store the latest stock price of each company in StockPrices table
    const storeLatestPricesPromise = storeLatestPrices(latestStockPrices);

    // forward the historical stock prices to generate-signal for processing
    await callGenerateSignalLambda(latestStockPrices);
    
    await updateSymbolsStatePromise;
    await storeLatestPricesPromise;
};
