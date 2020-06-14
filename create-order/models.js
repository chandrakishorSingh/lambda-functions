const {formatDate} = require('./utils');

class Trade {
    constructor(symbol, signalType, quantity, price, tradeAmount) {
        this.Symbol = symbol;
        this.SignalType = signalType;
        this.Quantity = quantity;
        this.Price = price;
        this.TradeAmount = tradeAmount;
        this.CreatedAt = formatDate(new Date());
    }
}

exports.Trade = Trade;