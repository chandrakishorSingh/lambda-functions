function firstLetterLower(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function mapDatabaseResponse(res) {
    return Object.entries(res).reduce((a, b) => {
        const key = firstLetterLower(b[0]);
        const value = b[1];
        return {...a, [key]: value};
    }, {});
}

function firstLetterUpper(str) {
    return str.charAt(0).toLowerUpper() + str.slice(1);
}

function mapDatabaseRequest(res) {
    return Object.entries(res).reduce((a, b) => {
        const key = firstLetterUpper(b[0]);
        const value = b[1];
        return {...a, [key]: value};
    }, {});
}

exports.mapDatabaseResponse = mapDatabaseResponse;
exports.mapDatabaseRequest = mapDatabaseRequest;
