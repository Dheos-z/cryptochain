const crypto = require('crypto');

const cryptoHash = (...inputs) => {
    const hash = crypto.createHash('sha256');

    // Computes the hash of the array values in sorted order,
    // so that the input values given in any order are always sorted and computed the same way
    // Map all inputs to a stringified version to enable having a new hash when we modify the outputMap
    hash.update(inputs.map(input => JSON.stringify(input)).sort().join(' ')); // stringify to transform JSON into a JS object
    return hash.digest('hex');
};  

module.exports = cryptoHash;