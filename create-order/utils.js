// gives a string repr. of given number with padding of zeros from left
function padNumber(num, len) {
    if (num.toString().length < len) {
        let result = '';
        for (let i = 0; i < len - num.toString().length; i++) {
            result += '0';
        }
        return result + num.toString();
    }
    return num.toString();
}

// formats the date obj in YYYY-MM-DD format
function formatDate(date)  {
    return [date.getFullYear().toString(), padNumber(date.getMonth() + 1, 2), padNumber(date.getDate(), 2)].join('-');
}

function toFixed(n, pos = 2) {
    return +n.toFixed(2);
}

exports.formatDate = formatDate;
exports.toFixed = toFixed;
