import React, { Component } from 'react';
import coin from '../assets/coin.gif'; // Import the logo as a JS object
import { Link } from 'react-router-dom';

class App extends Component {
    state = { walletInfo: {} };

    componentDidMount() {
        fetch(`${document.location.origin}/api/wallet-info`)
            .then(response => response.json())
            .then(json => this.setState({ walletInfo: json }));
    }

    // Every component needs a render() method to describe how it has to be rendered
    render() {
        const { address, balance } = this.state.walletInfo;

        return (
            <div className='App'>
                <h1>
                    The Zedcoin
                </h1>
                <img className='logo' src={coin}></img>
                <br />
                <br />
                <div><Link to='/blocks'>Blocks</Link></div>
                <div><Link to='/conduct-transaction'>Conduct a transaction</Link></div>
                <div><Link to='/transaction-pool'>Transaction Pool</Link></div>
                <br />
                <div className='WalletInfo'>
                    <div>Address: {address}</div>
                    <div>Balance: {balance}</div>
                </div>
            </div>
        );
    }
}

// In Node, we only need to use export keyword
// (whereas in JS, need to use module.exports = ...)

export default App;