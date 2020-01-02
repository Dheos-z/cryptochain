const { STARTING_BALANCE } = require('../config');
const Transaction = require('./transaction');
// Short for :
// const ec = require('../util').ec, cryptoHash = require('../util').cryptoHash
const { ec, cryptoHash } = require('../util');


class Wallet {
    constructor() {
        this.balance = STARTING_BALANCE;

        this.keyPair = ec.genKeyPair();

        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data)); // Use private key to sign data
    }

    createTransaction({ recipient, amount, chain }) {
        if (chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }

        // If amount is not a number
        if (isNaN(amount)) {
            throw new Error('Amount is not a number');
        }

        // if amount exceeds balance
        if (amount > this.balance) {
            throw new Error('Amount exceeds balance');
        }

        // if amount is 0
        if (amount === 0) {
            throw new Error('Amount is 0');
        } else if (amount < 0) {
            throw new Error('Amount is negative');
        }

        // If the recipient is the sender
        if (recipient === this.publicKey) {
            throw new Error('Recipient and sender are the same');
        } 

        return new Transaction({ senderWallet: this, recipient, amount });
    }

    static calculateBalance({ chain, address }) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;

        for (let i = chain.length - 1; i > 0; i--) {
            const block = chain[i];

            for (let transaction of block.data) {
                if (transaction.input.address === address) {
                    hasConductedTransaction = true;
                }

                const addressOutput = transaction.outputMap[address];

                if (addressOutput) {
                    outputsTotal += addressOutput;
                }
            }

            if (hasConductedTransaction) {
                break;
            }
        }

        return hasConductedTransaction ?
            outputsTotal :
            STARTING_BALANCE + outputsTotal;
    }
}


module.exports = Wallet;