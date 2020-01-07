import React, { Component } from 'react';
import logo from '../assets/logo.jpg'; // Import the logo as a JS object
import {Link} from 'react-router-dom';

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
            <div className='App'>
                <img className='logo' src={logo}></img>
                <br/>
                <div>
                    Welcome to the Zedcoin blockchain...
                </div>
                <br/>
                <div><Link to='/blocks'>Blocks</Link></div>
                <div><Link to='/conduct-transaction'>Conduct a transaction</Link></div>
                <br/>
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