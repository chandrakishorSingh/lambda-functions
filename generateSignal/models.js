class Signal {
    constructor(symbol, signalType, fastD, fastK, signalTime, signalPrice) {
        this.Symbol = symbol;
        this.CreatedAt = signalTime;
        this.FastD = fastD;
        this.FastK = fastK;
        this.SignalType = signalType;
        this.Price = signalPrice;
    }
}

exports.Signal = Signal;