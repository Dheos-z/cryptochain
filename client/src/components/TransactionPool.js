import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';
import { Link } from 'react-router-dom';
import history from '../history';

const POLL_INTERVAL_MS = 10000; // the transaction pool will be polled according to the interval

class TransactionPool extends Component {
    state = { transactionPoolMap: {} };

    fetchTransactionPoolMap = () => {
        fetch(`${document.location.origin}/api/transaction-pool-map`) // document.location.origin replaces localhost:3000 so that
            // every peer can fetch according to it own origin
            .then(response => response.json())
            .then(json => this.setState({ transactionPoolMap: json }));
    }

    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/mine-transactions`)
            .then(response => {
                if(response.status === 200) {
                    alert('success');
                    history.push('/blocks');
                } else {
                    alert('The mine-transactions block request did not complete.');
                }
            });
    }

    // We want this data to be available right away
    componentDidMount() {
        this.fetchTransactionPoolMap();

        // JS function that allows calling a function at regular intervals
        // We name the function so that we can use it later to clear the interval
        this.fetchPoolMapInterval = setInterval(
            () => this.fetchTransactionPoolMap(),
            POLL_INTERVAL_MS
        );
    }

    // Clear the interval if we are no longer in the transaction pool
    componentWillUnmount() {
        clearInterval(this.fetchPoolMapInterval);
    }

    render() {
        return (
            <div className='TransactionPool'>
                <div><Link to='/'>Home</Link></div>
                <h3>Transaction Pool</h3>
                {
                    Object.values(this.state.transactionPoolMap).map(transaction => {
                        return (
                            <div key={transaction.id}>
                                <hr />
                                <Transaction transaction={transaction} />
                            </div>
                        )
                    })
                }
                <hr/>
                <Button
                    bsstyle="danger"
                    onClick={this.fetchMineTransactions}
                >
                    Mine the transactions
                </Button>
            </div>
        )
    }
}

export default TransactionPool;