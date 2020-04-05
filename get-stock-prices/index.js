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
    const symbolsState = await getSymbolsState();
    let currentSymbols = await getCurrentSymbols(symbolsState);
    
    // get the stock prices from API of all 5 companies
    const latestStockPrices = [];
    const historicalStockPrices = [];
    const discardedSymbols = [];
    for (let symbol of currentSymbols) {
        const stockPricesData = await getStockPrices(symbol, TS_60MIN);
        
        // discard the stocks for which API didn't give 32 data points
        if (stockPricesData.length === 32) {
            latestStockPrices.push({...stockPricesData[stockPricesData.length - 1]});
            historicalStockPrices.push({ symbol: symbol, data: stockPricesData });
        } else {
            discardedSymbols.push(symbol);
        }
        
        await wait(5000);
    }
    
    // determine actual symbols
    currentSymbols = currentSymbols.filter((currentSymbol) => !discardedSymbols.includes(currentSymbol));
    
    // for logging purpose
    console.log('hello');
    console.log('latestStockPrices', latestStockPrices);
    console.log('historicalStockPrices', historicalStockPrices);

    // update the SymbolsState table to reflect the changes in the state of current 5 companies
    const updateSymbolsStatePromise = updateSymbolsState(currentSymbols, symbolsState);
    
    // store the latest stock price of each company in StockPrices table
    const storeLatestPricesPromise = storeLatestPrices(latestStockPrices);

    // forward the historical stock prices to generate-signal for processing
    await callGenerateSignalLambda(historicalStockPrices);
    
    await updateSymbolsStatePromise;
    await storeLatestPricesPromise;
};
