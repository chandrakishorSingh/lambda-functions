const {toFixed} = require('./utils');

class PortfolioItem {
    constructor(Symbol, Quantity, AvgPrice) {
        this.Symbol = Symbol;
        this.Quantity = Quantity;
        this.AvgPrice = AvgPrice;
        this.TotalInvestment = toFixed(Quantity * AvgPrice);
    }
}

exports.PortfolioItem = PortfolioItem;