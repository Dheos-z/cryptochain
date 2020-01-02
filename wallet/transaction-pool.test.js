const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');


describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(() => {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet,
            recipient: 'recipient-bro',
            amount: 50
        });
    });

    describe('setTransaction()', () => {
        it('adds a transaction', () => {
            transactionPool.setTransaction(transaction);

            // Check that the added transaction is exactly the instance called `transaction` (with toBe)
            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
        });
    });

    describe('existingTransaction()', () => {
        it('returns an existing transaction given an input address', () => {
            transactionPool.setTransaction(transaction);

            expect(
                transactionPool.existingTransaction({ inputAddress: senderWallet.publicKey })
            ).toBe(transaction);
        });
    });

    // Test for the function that valids ALL transactions of the pool
    describe('validTransactions()', () => {
        let validTransactions, errorMock;

        beforeEach(() => {
            validTransactions = [];
            errorMock = jest.fn(); //
            global.console.error = errorMock; // Catch the errors fired by the tests

            for (let i = 0; i < 10; i++) {
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'a-lucky-guy',
                    amount: 30
                });

                if (i % 3 === 0) {
                    transaction.input.amount = 9999999;
                } else if(i%3===1) {
                    transaction.input.signature = new Wallet().sign('other-data');
                } else {
                    validTransactions.push(transaction);
                }

                transactionPool.setTransaction(transaction);
            }
        });

        it('returns the valid transactions', () => {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        });

        // Make sure that errors have been logged for invalid transactions
        it('logs errors for the invalid transactions', () => {
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        });
    });

    describe('clear()', () => {
        it('clears the transactions', () => {
            transactionPool.clear();

            expect(transactionPool.transactionMap).toEqual({});
        });     
    });

    // Safer method to clear transactions
    // It checks first that these transactions have been recorded on the blockchain
    describe('clearBlockchainTransactions()', () => {
        it('clears the pool of all existing blockchain transactions', () => {
            const blockchain = new Blockchain();
            const expectedTransactionMap = {};

            for(let i=0;i<6; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'my-bro', amount: 20
                });

                transactionPool.setTransaction(transaction);

                if(i%2===0) {
                    blockchain.addBlock({data: [transaction]});
                } else {
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }

            transactionPool.clearBlockchainTransactions({chain: blockchain.chain});

            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
    });
});