const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // sec = Standards of Efficient Cryptography
                                // p = Prime (number), 256 bits
                                // Same secp used by Bitcoin
const cryptoHash = require ('./crypto-hash');

const verifySignature = ({ publicKey, data, signature }) => {
    // We can use an already implemented method that verifies signature
    // But first we need to extract a key from the public key :
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

    // The verify method takes the hash of the data and the signature
    return keyFromPublic.verify(cryptoHash(data), signature);
};

module.exports = { ec, verifySignature, cryptoHash };