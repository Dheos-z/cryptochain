import React from 'react';
import { render } from 'react-dom';
import App from './components/App';
import { Router, Switch, Route } from 'react-router-dom';
import history from './history';
import Blocks from './components/Blocks';
import './index.css';

// This markup is not HTML, it is JSX (Javascript XML-like syntax)
render(
    // history of the props = the imported history from history.js
    <Router history={history}>
        <Switch>
            {/* exact because otherwise every route containing '/' at the
            beginning will lead to the '/' path (/blocks, /blabla, /etc ...) */}
            <Route exact path='/' component={App} />
            <Route path='/blocks' component={Blocks} />
        </Switch>
    </Router>,
    document.getElementById('root')
);