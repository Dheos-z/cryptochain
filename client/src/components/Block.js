// Curly braces ({Component}) -> not a default export
// No curly braces (React) -> default export
import React, { Component } from 'react';
import {Button} from 'react-bootstrap';
import Transaction from './Transaction';

class Block extends Component {
    state = {displayTransaction: false};

    toggleTransaction = () => {
        this.setState({displayTransaction: !this.state.displayTransaction});
    }

    // Instead of a get method, we could have used a function (displayTransaction = () => {...}), but
    // then in the return statement of the the render function we would have to call this function instead
    // of just getting it from the get method, which is not convenient and can make the app slower
    get displayTransaction() {
        const { data } = this.props.block;
        // props stands for properties. It is a way to pass data from the parent (Blocks) to the child (Block)
        // The Blocks instance passes its 'block' data to its child
        const stringifiedData = JSON.stringify(data);
        const dataDisplay = stringifiedData.length > 35 ?
            `${stringifiedData.substring(0, 35)}...` :
            stringifiedData;
        
            if(this.state.displayTransaction) {
                return (
                    <div>
                        {
                            data.map(transaction => (
                                <div key={transaction.id}>
                                    <hr/>
                                    {/* Pass the transaction to the props so it can be used in Transaction.js : */}
                                    <Transaction transaction={transaction} />
                                </div>
                            ))
                        }
                        <br/>
                        <Button
                            bsStyle="danger"
                            bsSize="small"
                            onClick={this.toggleTransaction}
                        >
                            Show Less
                        </Button>
                    </div>
                );
            }

        return (
            <div>
                <div>Data : {dataDisplay}</div>
                <Button 
                    bsStyle="danger" 
                    bsSize="small" 
                    onClick={this.toggleTransaction}
                >
                    Show More
                </Button>
            </div>
        );
    }



    render() {
        const { timestamp, hash } = this.props.block;
        // props stands for properties. It is a way to pass data from the parent (Blocks) to the child (Block)
        // The Blocks instance passes its 'block' data to its child
        const hashDisplay = hash.length > 15 ?
            `${hash.substring(0, 15)}...` :
            hash;

        // Pair of parentheses to write it clean on multiple lines
        return (
            <div className='Block'>
                <div>Hash: {hashDisplay}</div>
                <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
                {this.displayTransaction}
            </div>
        );
    }
};

export default Block;