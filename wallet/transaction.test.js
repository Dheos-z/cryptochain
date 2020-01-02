const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;

    beforeEach(() => {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key'; // No need to put a real public key
        amount = 50; // Anything below the initial balance of a wallet (1000)
        transaction = new Transaction({ senderWallet, recipient, amount });
    });

    it('has an `id`', () => {
        expect(transaction).toHaveProperty('id');
    });

    describe('outputMap', () => {
        it('has an `outputMap`', () => {
            expect(transaction).toHaveProperty('outputMap');
        });

        it('outputs the amount to the recipient', () => {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        });

        it('outputs the remaining balance for the `senderWallet`', () => {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });

    // The input contains all the informations about the transaction
    // It is used to create the signature of the transaction
    describe('input', () => {
        it('has an `input`', () => {
            expect(transaction).toHaveProperty('input');
        });

        it('has a `timestamp` in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp'); // Properties of a class can themselves have properties
        });

        it('sets the amount to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the input', () => {
            expect(
                verifySignature({
                    publicKey: senderWallet.publicKey,
                    data: transaction.outputMap, // The data to sign is the outputMap containing all the movements of assets
                    signature: transaction.input.signature
                })
            ).toBe(true);
        });
    });

    describe('validTransaction()', () => {
        let errorMock;

        beforeEach(() => {
            errorMock = jest.fn();

            global.console.error = errorMock;
        });

        describe('when the transaction is valid', () => {
            it('returns true', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });

        describe('when the transaction is invalid', () => {
            describe('and a transaction outputMap value is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.outputMap[senderWallet.publicKey] = 9999999; // fake sender balance

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });

            describe('and the transaction input signature is invalid', () => {
                it('returns false and logs an error', () => {
                    transaction.input.signature = new Wallet().sign('fake-data'); // fake signature

                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });

    // Tests when a transaction is updated (change in the outputMap)
    describe('update()', () => {
        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe('and the amount is not a number', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: 'ntm', amount: 'wesh'
                    })
                }).toThrow('Amount is not a number');
            });
        });

        describe('and the amount is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: 'ntm', amount: 9999999
                    })
                }).toThrow('Amount exceeds balance');
            });
        });

        describe('and the amount is 0', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: 'ntm', amount: 0
                    })
                }).toThrow('Amount is 0');
            });
        });

        describe('and the amount is negative', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update({
                        senderWallet, recipient: 'ntm', amount: -15
                    })
                }).toThrow('Amount is negative');
            });
        });

        describe('and the amount is valid', () => {
            beforeEach(() => {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient-public-key';
                nextAmount = 50;

                transaction.update({ senderWallet, recipient: nextRecipient, amount: nextAmount });
            });

            it('outputs the amount to the next recipient', () => {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });

            // The sender is paying a new amount to a new user. So the amount given back to the sender is substracted by this new amount
            it('substracts the amount from the original sender output amount', () => {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });

            it('maintains a total output that matches the input amount', () => {
                const outputTotal = Object.values(transaction.outputMap)
                    .reduce((total, outputAmount) => total + outputAmount);

                expect(transaction.input.amount).toEqual(outputTotal);
            });

            it('re-signs the transaction', () => {
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('and another update for the same recipient', () => {
                let addedAmount;

                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update({
                        senderWallet, recipient: nextRecipient, amount: addedAmount
                    });
                });

                it('adds to the recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient])
                        .toEqual(nextAmount + addedAmount);
                });

                it('subtracts the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey])
                        .toEqual(originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });
    });

    describe('rewardTransaction()', () => {
        let rewardTransaction, minerWallet;

        beforeEach(() => {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({ minerWallet });
        });

        it('creates a transaction with the reward input', () => {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('creates one transaction for the miner with the `MINING_REWARD`', () => {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
});