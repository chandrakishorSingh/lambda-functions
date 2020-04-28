class Signal {
    constructor(symbol, createdAt, fastD, fastK, signalType, price) {
        this.Symbol = symbol;
        this.CreatedAt = createdAt;
        this.FastD = fastD;
        this.FastK = fastK;
        this.SignalType = signalType;
        this.Price = price;
    }
}

exports.Signal = Signal;