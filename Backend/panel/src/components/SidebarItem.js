import React from 'react';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";


class SidebarItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        return (
            <Link to={this.props.link} className="sidebar-item">
                {this.props.name}
            </Link>
        );
    }
}

export default SidebarItem;