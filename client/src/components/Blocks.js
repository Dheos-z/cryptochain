import React, { Component } from 'react';
import Block from './Block';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

class Blocks extends Component {
    state = { blocks: [], paginatedId: 1, blocksLength: 0 };

    componentDidMount() {
        fetch(`${document.location.origin}/api/blocks/length`)
            .then(response => response.json())
            .then(json => this.setState({ blocksLength: json }));

        this.fetchPaginatedBlocks(this.state.paginatedId)(); // () to prevent infinite loop (click button -> change state -> render -> click button...)
    }

    fetchPaginatedBlocks = paginatedId => () => { // double callback to prevent infinite loop (click button -> change state -> render -> click button...)
        fetch(`${document.location.origin}/api/blocks/${paginatedId}`)
            .then(response => response.json())
            .then(json => this.setState({ blocks: json }));
    }

    render() {
        console.log('this.state', this.state);

        return (
            <div>
                <div><Link to='/'>Home</Link></div>
                <h3>Blocks</h3>
                <div>
                    {
                        // keys() returns an iterator over the keys of the array
                        // [] is used to take the keys as an array itself
                        // ... to apply each of those keys as an idividual element within the array itself
                        // Test it on the browser dev tool to see
                        [...Array(Math.ceil(this.state.blocksLength/5)).keys()].map(key => {
                            const paginatedId = key+1;

                            return(
                                <span key={key} onClick={this.fetchPaginatedBlocks(paginatedId)}>
                                    <Button bsSize="small" bsStyle="danger">
                                        {paginatedId}
                                    </Button>{' '} {/* smart way to create space between span components */}
                                </span>
                            )
                        })
                    }
                </div>
                {
                    this.state.blocks.map(block => {
                        return (
                            <Block key={block.hash} block={block} />
                        );
                    })
                }
            </div>
        );
    }
}

export default Blocks;