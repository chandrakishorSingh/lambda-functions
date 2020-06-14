// used to handle data in more structured  way
class StockPrice {
    constructor(symbol, date, price) {
        this.symbol = symbol;
        this.date = date;
        this.price = price;
    }
}

exports.StockPrice = StockPrice;