const redis = require('redis');

const CHANNELS = {
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};


class PubSub {
    constructor({ blockchain, transactionPool }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        // We want the node to be both a publisher and a subscriber
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();
        // Subscribe to all the channels
        this.subscribeToChannels();

        // Listen to messages on the channel
        this.subscriber.on(
            'message', 
            (channel, message) => this.handleMessage(channel,message)
        );
    }

    // Execute actions depending on the message received
    handleMessage(channel,message) {
        console.log(`Message received. Channel: ${channel}, message: ${message}`);
        const parsedMessage = JSON.parse(message); // Transform JSON string into JS object

        switch(channel) {
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({
                        chain: parsedMessage
                    });
                });
                break;
            case CHANNELS.TRANSACTION:
                this.transactionPool.setTransaction(parsedMessage);
                break;
            default:
                return;
        }
    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => { // No need parentheses when there is only 1 parameter (here it is channel)
            this.subscriber.subscribe(channel);
        })
    }

    // Publish a message on a specific channel to all subscribers of this channel
    publish({channel, message}) {
        // Unsubscribe to the channel, publish to this channel and then resubscribe
        // Trick to avoid publishing to itself
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
        });
    }


    // Publish its own version of the blockchain on the BLOCKCHAIN channel
    broadcastChain() {
       this.publish({
           channel: CHANNELS.BLOCKCHAIN,
           message: JSON.stringify(this.blockchain.chain) // Transform JS object to JSON string
       });
    }

    // Publish a transaction on the TRANSACTION channel
    broadcastTransaction(transaction) {
       this.publish({
        channel: CHANNELS.TRANSACTION,
        message: JSON.stringify(transaction)
       });
    }
}


module.exports = PubSub;