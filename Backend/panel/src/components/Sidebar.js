import React from 'react';
import SidebarItem from "./SidebarItem";


class Sidebar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        return (
            <div className="sidebar" style={{maxWidth: this.props.width, width: this.props.width}}>
                <SidebarItem name="Create Question" link="create_question"/>
                <SidebarItem name="Edit Question" link="edit_question"/>
            </div>
        );
    }
}

export default Sidebar;