import React from 'react';
import { render } from 'react-dom';
import App from './components/App';

// This markup is not HTML, it is JSX (Javascript XML-like syntax)
render(
    <App/>, // No need 2nd tag because the content of the tag is empty
    document.getElementById('root')
);