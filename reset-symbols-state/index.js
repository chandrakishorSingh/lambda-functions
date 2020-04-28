const { getSymbolsState, resetSymbolsState } = require('./utils');

exports.handler = async (event) => {
    // reset all the symbols to false state
    const symbolsState = await getSymbolsState();
    await resetSymbolsState(symbolsState);
};
