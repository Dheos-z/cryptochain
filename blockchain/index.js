const Block = require('./block');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }

    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        });

        this.chain.push(newBlock);
    }

    replaceChain(chain, validateTransactions, onSuccess) {
        // Check length of the new chain
        if (chain.length <= this.chain.length) {
            console.error('The incoming chain is too short');
            return;
        }

        // Check validity of the new chain
        if (!Blockchain.isValidChain(chain)) {
            console.error('The incoming chain is not valid');
            return;
        }

        if (validateTransactions && !this.validTransactionData({ chain })) {
            console.error('The incoming chain has invalid data');
            return;
        }

        if (onSuccess) onSuccess();

        console.log('replacing chain with', chain);
        this.chain = chain;
    }

    validTransactionData({ chain }) {
        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            let rewardTransactionCount = 0;
            const transactionSet = new Set(); // A set cannot have duplicates

            for (let transaction of block.data) {
                // THE TRANSACTION IS A REWARD TRANSACTION
                if (transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount++;

                    // Check if there is more than 1 mining reward
                    if (rewardTransactionCount > 1) {
                        console.error('Miner rewards exceed limit');
                        return false;
                    }

                    // Check the amount of the mining reward
                    // Object.values stores all the values of an object into a numbered array
                    // Since there is only 1 value, in the reward transaction outputmap, it is easy to check
                    if (Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('Miner reward amount is invalid');
                        return false;
                    }
                }
                // THE TRANSACTION IS A USER TRANSACTION
                else {
                    if (!Transaction.validTransaction(transaction)) {
                        console.error('Invalid transaction');
                        return false;
                    }

                    // Make sure that if a fake transaction is trying to get in a block, we detect it by recalculating the balance
                    // /!\ use this.chain and not chain, since the attacker can also fake the chain given to this function
                    const trueBalance = Wallet.calculateBalance({
                        chain: this.chain,
                        address: transaction.input.address
                    });

                    if (transaction.input.amount !== trueBalance) {
                        console.error('Invalid input amount');
                        return false;
                    }

                    // Add all transactions that are not reward transactions so we can
                    // check if there are duplicate transactions
                    if (transactionSet.has(transaction)) {
                        console.error('An identical transaction appears more than one in a block');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }

        return true;
    }

    static isValidChain(chain) {

        // Check genesis block
        // Check values of the block instead of checking if references are the same
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
            return false;
        }

        // Check last hash of every block
        for (let i = 1; i < chain.length; i++) {
            const { timestamp, lastHash, hash, data, nonce, difficulty } = chain[i];
            const actualLastHash = chain[i - 1].hash;
            const lastDifficulty = chain[i - 1].difficulty;

            if (lastHash !== actualLastHash) return false;

            const validatedHash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);

            if (hash !== validatedHash) return false;

            if (Math.abs(lastDifficulty - difficulty) > 1) return false;
        }

        return true;
    }
}


module.exports = Blockchain;