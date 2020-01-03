import React, { Component } from 'react';
import Blocks from './Blocks';

class App extends Component {
    state = { walletInfo: {} };

    componentDidMount() {
        fetch('http://localhost:3000/api/wallet-info')
        .then(response => response.json())
        .then(json => this.setState({walletInfo: json}));
    }
    
    // Every component needs a render() method to describe how it has to be rendered
    render() {
        const { address, balance } = this.state.walletInfo;

        return (
            <div>
                <div>
                    Welcome to the blockchain of your mother...
                </div>
                <div>Address: {address}</div>
                <div>Balance: {balance}</div>
                <br />
                <Blocks />
            </div>
        );
    }
}

// In Node, we only need to use export keyword
// (whereas in JS, need to use module.exports = ...)

export default App;