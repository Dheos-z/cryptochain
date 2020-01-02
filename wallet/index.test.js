const Wallet = require('./index');
const { verifySignature } = require('../util');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');


describe('Wallet', () => {
    let wallet;

    beforeEach(() => {
        wallet = new Wallet();
    });

    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`', () => {
        // console.log(wallet.publicKey);

        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data', () => {
        const data = 'signme-test';

        it('verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });

        it('does not verify an invald signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data) // Data signed by another user, which yield to an invalid signature
                })
            ).toBe(false);
        });
    });

    describe('createTransaction()', () => {
        describe('and the amount is not a number', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({
                    amount: 'i-am-money',
                    recipient: 'recip'
                })).toThrow('Amount is not a number');
            });
        });
        
        describe('and the amount exceeds the balance', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({
                    amount: 9999999,
                    recipient: 'lol-recipient'
                })).toThrow('Amount exceeds balance');
            });
        });

        describe('and the amount is 0', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({
                    amount: 0,
                    recipient: 'recip'
                })).toThrow('Amount is 0');
            });
        });

        describe('and the amount is negative', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({
                    amount: -10,
                    recipient: 'recip'
                })).toThrow('Amount is negative');
            });
        });

        describe('and the recipient is yourself', () => {
            it('throws an error', () => {
                expect(() => wallet.createTransaction({
                    amount: 10,
                    recipient: wallet.publicKey
                })).toThrow('Recipient and sender are the same');
            });
        });


        describe('and the amount is valid', () => {
            let transaction, amount, recipient;

            beforeEach(() => {
                amount = 50;
                recipient = 'izi-recipient';
                transaction = wallet.createTransaction({ amount, recipient });
            });

            it('creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('matches the transaction input with the wallet', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs the amount the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            });
        });

        // If a chain is passed when we create a transaction, it because it will calculate the balance 
        // We want the function calculateBalance() to be called
        describe('and a chain is passed', () => {
            it('calls `Wallet.calculateBalance`', () => {
                const calculateBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance; // Keep a backup of this function
                Wallet.calculateBalance = calculateBalanceMock; // We lose the initial function Wallet.calculateBalance

                wallet.createTransaction({
                    recipient: 'random-recipient',
                    amount: 30,
                    chain: new Blockchain().chain
                });

                expect(calculateBalanceMock).toHaveBeenCalled();

                // Restore the function calculateBalance
                Wallet.calculateBalance = originalCalculateBalance;
            });
        });
    });

    describe('calculateBalance()', () => {
        beforeEach(() => {
            blockchain = new Blockchain();
        });

        describe('and there are not outputs for the wallet', () => {
            it('returns the `STARTING_BALANCE`', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE);
            });
        });

        describe('and there are outputs for the wallet', () => {
            let transactionOne, transactionTwo;

            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 42
                });

                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 75
                });

                blockchain.addBlock({ data: [transactionOne, transactionTwo] });
            });

            it('adds the sum of all outputs to the wallet balance', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE +
                    transactionOne.outputMap[wallet.publicKey] +
                    transactionTwo.outputMap[wallet.publicKey]
                );
            });

            describe('and the wallet has made a transaction', () => {
                let recentTransaction;

                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'dump-recipient',
                        amount: 23
                    });

                    blockchain.addBlock({ data: [recentTransaction] });
                });

                // If the wallet has made a transaction, its balance is the output of this wallet in this transaction
                it('returns the output amount of the recent transaction', () => {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
                });

                // If the wallet has made a transaction and then in the next block other
                // wallets made transactions to this wallet
                describe('and there are outputs next to and after the recent transaction', () => {
                    let sameBlockTransaction, nextBlockTransaction;

                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({
                            recipient: 'other-recipient',
                            amount: 41
                        });

                        sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet });

                        blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction] });

                        nextBlockTransaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey,
                            amount: 99
                        });

                        blockchain.addBlock({ data: [nextBlockTransaction] });
                    });

                    it('includes the output amounts in the returned balance', () => {
                        expect(
                            Wallet.calculateBalance({
                                chain: blockchain.chain,
                                address: wallet.publicKey
                            })
                        ).toEqual(
                            recentTransaction.outputMap[wallet.publicKey] +
                            sameBlockTransaction.outputMap[wallet.publicKey] + 
                            nextBlockTransaction.outputMap[wallet.publicKey]
                        );
                    });
                });
            });
        });
    });
});