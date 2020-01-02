const uuid = require('uuid/v1');
const { verifySignature } = require('../util');
const { MINING_REWARD, REWARD_INPUT } = require('../config');



class Transaction {
    constructor({ senderWallet, recipient, amount, outputMap, input }) {
        this.id = uuid();
        this.outputMap = outputMap || this.createOutputMap({ senderWallet, amount, recipient });
        this.input = input || this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    createOutputMap({ amount, senderWallet, recipient }) {
        const outputMap = {};

        outputMap[recipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    createInput({ senderWallet, outputMap }) {
        return {
            timestamp: Date.now(),
            amount: senderWallet.balance,
            address: senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        };
    }

    update({ senderWallet, recipient, amount }) {

        if (isNaN(amount)) {
            throw new Error('Amount is not a number');
        }

        if (amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error('Amount exceeds balance');
        }

        if (amount === 0) {
            throw new Error('Amount is 0');
        } else if (amount < 0) {
            throw new Error('Amount is negative');
        }

        // Add the amount to the output of the recipient
        if (!this.outputMap[recipient]) {
            this.outputMap[recipient] = amount;
        } else {
            this.outputMap[recipient] += amount;
        }

        // Substract the amount to the sender
        this.outputMap[senderWallet.publicKey] -= amount;

        // Create the new signature
        this.input = this.createInput({ senderWallet, outputMap: this.outputMap });
    }

    // Check if a transaction is valid
    static validTransaction(transaction) {
        const { input: { address, amount, signature }, outputMap } = transaction;

        // Reduce all the outputMap values to one value: the sum of all values
        const outputTotal = Object.values(outputMap)
            .reduce((total, outputAmount) => total + outputAmount);

        // Check if the sum of output amoounts equals the input amount
        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }

        if (!verifySignature({ publicKey: address, data: outputMap, signature })) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }

        return true;
    }

    static rewardTransaction({ minerWallet }) {
        return new this({
            input: REWARD_INPUT,
            outputMap: { [minerWallet.publicKey]: MINING_REWARD }
        });
    }
}

module.exports = Transaction;