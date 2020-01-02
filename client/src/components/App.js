import React, { Component } from 'react';

class App extends Component {
    // state = { walletInfo: { address: 'fooxv6', balance: 9999 } };

    // Every component needs a render() method to describe how it has to be rendered
    render() {
        // const { address, balance } = this.state.walletInfo;

        return (
            <div>
                {/* <div>
                    Welcome to the blockchain of your mother...
                </div> */}
                {/* <div>Address: {address}</div>
                <div>Balance: {balance}</div> */}
                Petit pet
            </div>
        );
    }
}

// In Node, we only need to use export keyword
// (whereas in JS, need to use module.exports = ...)

export default App;