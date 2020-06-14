// checks if object is empty(ignoring prop. that have symbol as key)
function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}

exports.isObjectEmpty = isObjectEmpty;