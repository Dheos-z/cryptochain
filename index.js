
const express = require('express');
const Blockchain = require('./blockchain');
const bodyParser = require('body-parser');
const PubSub = require('./app/pubsub');
const request = require('request');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
const path = require('path');

// Check if we are in development mode
const isDevelopment = process.env.ENV === 'development';

const REDIS_URL = isDevelopment ?
    // Connect to the local default redis server if development mode (uses redis protocol, localhost address and default redis port 6379)
    'redis://127.0.0.1:6379' :
    // Connect to the redis server given by Heroku
    'redis://h:p3d948107971e8b2e9f67d161c06d27f6a50f3d651883e7b642bd77e27b24bb86@ec2-54-164-76-107.compute-1.amazonaws.com:16499';
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`; // The root node is the node that starts the blockchain

const app = express();
const blockchain = new Blockchain();
const wallet = new Wallet();
const transactionPool = new TransactionPool();
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL });
const transactionMiner = new TransactionMiner({ blockchain, transactionPool, wallet, pubsub });



// Activate body-parser
app.use(bodyParser.json());
// Ask express to serve all the files in the client/dist directory
app.use(express.static(path.join(__dirname, 'client/dist')));


// Get the blocks of the blockchain 
app.get('/api/blocks', (req, res) => { // request, response
    res.json(blockchain.chain);
});


// Pagination of the blocks
app.get('/api/blocks/length', (req, res) => {
    res.json(blockchain.chain.length);
});

app.get('/api/blocks/:id', (req, res) => {
    const { id } = req.params;
    const { length } = blockchain.chain;

    // slice() returns a copy of the variable, reverse() reverses the elements of the given array
    const blocksReversed = blockchain.chain.slice().reverse();

    let startIndex = (id - 1) * 5;
    let endIndex = id * 5;

    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;

    res.json(blocksReversed.slice(startIndex, endIndex));
});

// Request to mine a block
app.post('/api/mine', (req, res) => {
    const { data } = req.body;

    blockchain.addBlock({ data }); // addBlock => mineBlock (iterate to find the right nonce)

    pubsub.broadcastChain();

    // As a result of the mining, get the blocks of the chain
    res.redirect('/api/blocks');
});


// Create a transaction
app.post('/api/transact', (req, res) => {
    const { amount, recipient } = req.body;
    // console.log(`amout: ${amount}, recip: ${recipient}`);
    let transaction = transactionPool.existingTransaction({ inputAddress: wallet.publicKey });

    try {
        if (transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ recipient, amount, chain: blockchain.chain });
        }
    } catch (error) {
        // 400 is the HTTP protocol error for this
        return res.status(400).json({ type: 'error', message: error.message });
    }

    // Set transaction into the local transactionPool
    transactionPool.setTransaction(transaction);

    // Broadcast transaction to all other nodes 
    pubsub.broadcastTransaction(transaction);

    // type: success is the opposite of type: error
    res.json({ type: 'success', transaction });
});


// Get the transaction pool
app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
});


// Mine the transactions
// /!\ Even if there are no transaction between users, it create a reward transaction and add a block
app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
    // minetransactions() : get valid transactions from the transaction pool,
    // generate the miner's reward transaction, add block to the blockchain (which implies to mine the block),
    // clear the transaction pool

    res.redirect('/api/blocks');
});


// Get wallet info
app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;

    res.json({
        address,
        balance: Wallet.calculateBalance({ chain: blockchain.chain, address })
    });
});


// Get all the addresses that were involved in a transaction (sender or recipient)
app.get('/api/known-addresses', (req, res) => {
    const addressMap = {};

    for (let block of blockchain.chain) {
        for (let transaction of block.data) {
            const recipient = Object.keys(transaction.outputMap); // recipient is an array of addresses

            recipient.forEach(recipient => addressMap[recipient] = recipient); // every recipient is added to the map
        }
    }

    res.json(Object.keys(addressMap));
});


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});



// Request to synchronize chain with the chain of the root
// (Useful when a node gets into the network and has a incomplete chain)
const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
        if (!error && response.statusCode === 200) { // 200 is the success of GET request in the HTTP protocol
            const rootChain = JSON.parse(body); // Convert a JavaScript Object Notation (JSON) string to a JS object

            // Ask to replace the chain
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const rootTransactionPoolMap = JSON.parse(body);

            // Ask to replace the transaction pool
            console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    });
}


// If development mode, seed the app with initial data
if (isDevelopment) {
    const walletFoo = new Wallet();
    const walletBar = new Wallet();

    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
        const transaction = wallet.createTransaction({
            recipient, amount, chain: blockchain.chain
        });

        transactionPool.setTransaction(transaction);
    };

    const walletAction = () => generateWalletTransaction({
        wallet, recipient: walletFoo.publicKey, amount: 5
    });

    const walletFooAction = () => generateWalletTransaction({
        wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
    });

    const walletBarAction = () => generateWalletTransaction({
        wallet: walletBar, recipient: wallet.publicKey, amount: 15
    });

    for (let i = 0; i < 20; i++) {
        if (i % 3 === 0) {
            walletAction();
            walletFooAction();
        }
        else if (i % 3 === 1) {
            walletAction();
            walletBarAction();
        }
        else {
            walletFooAction();
            walletBarAction();
        }

        transactionMiner.mineTransactions();
    }
}

let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

// listen to requests

// We want Heroku to have complete control over the overall port
const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening at localhost:${PORT}`);

    // Sync chain with the chain of the root
    // only if this node is not the root, to avoid redundancy
    if (PORT !== DEFAULT_PORT) {
        syncWithRootState();
    }
});
