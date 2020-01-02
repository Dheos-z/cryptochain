const cryptoHash = require('./crypto-hash');

describe('cryptoHash()', () => {
    it('generates a SHA-256 hashed output', () => {
        expect(cryptoHash('zaklebg'))
            .toEqual('519bf346b8699687ec06a554e25ef0e22ae3ed315c8de510620024ffd76241df');
    });

    it('produces the same hash with the same input arguments in any order', () => {
        expect(cryptoHash('a', 'b', 'c')).toEqual(cryptoHash('c', 'a', 'b'));
    });

    it('produces a unique hash when the properties have changed on an input', () => {
        const foo = {};
        const originalHash = cryptoHash(foo);
        foo['a'] = 'a';

        expect(cryptoHash(foo)).not.toEqual(originalHash);
    });
});