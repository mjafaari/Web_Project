import React from 'react';
import {BrowserRouter as Router, Route, Link, Switch, Redirect} from "react-router-dom";

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isLoggedIn: false}
    }

    render() {
        let {isLoggedIn} = this.state;
        if (isLoggedIn)
            return (
                <div className="main-page App-header">
                    Hello Respected Admin
                </div>
            );
        return (
            <Redirect to="/login"/>
        );
    }
}

export default MainPage;