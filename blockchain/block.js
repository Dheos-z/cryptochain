const hexToBinary = require('hex-to-binary');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const {cryptoHash} = require('../util');

class Block {
    constructor({ timestamp, lastHash, hash, data, nonce, difficulty}) {
      this.timestamp = timestamp;
      this.lastHash = lastHash;
      this.hash = hash;
      this.data = data;
      this.nonce = nonce;
      this.difficulty = difficulty;
    } 

    static genesis() {
        return new this(GENESIS_DATA);
    }

    static mineBlock({ lastBlock, data}) {
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let {difficulty} = lastBlock; // Create a `difficulty` variable which value is the difficulty of the last block
                                        // /!\ {difficulty} is not an object, it's a trick to write less code
        let nonce = 0; 

        // Match the difficulty of the hash to solve
        do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty({originalBlock: lastBlock, timestamp});
            hash = cryptoHash(timestamp, lastHash, data, nonce, difficulty);
        } while(hexToBinary(hash).substring(0,difficulty) !== '0'.repeat(difficulty));
            // Compares the `difficulty` first characters with the numbers of zeros that match the difficulty

        return new this({
            timestamp,
            lastHash,
            data,
            difficulty,
            nonce,
            hash
        });
    }

    static adjustDifficulty({timestamp, originalBlock}) {
        const {difficulty} = originalBlock;

        if(difficulty < 1) return 1;

        const difference = timestamp - originalBlock.timestamp;

        if(difference > MINE_RATE) return difficulty-1;

        return difficulty+1;
    }   
}

module.exports = Block;