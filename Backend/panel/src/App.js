import React from 'react';
import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './components.css';
import {BrowserRouter as Router, Route, Link, Switch, Redirect} from "react-router-dom";
import QuestionCreator from "./components/QuestionCreator";
import MainPage from "./components/MainPage";
import EditQuestion from "./components/EditQuestion";
import Login from "./components/Login";
import NoMatch from "./components/NoMatch";
import Sidebar from "./components/Sidebar";
import Icon from "./icon.png"


class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fixSidebar: 1,
            showSidebar: true,
            sidebarWidth: 260,
            position: 'fixed'
        };
        this.updateWindow = this.updateWindow.bind(this);
        this.showSidebar = this.showSidebar.bind(this);
        this.hideSidebar = this.hideSidebar.bind(this);
    }

    componentDidMount() {
        this.updateWindow();
        window.addEventListener("resize", this.updateWindow)
    }

    updateWindow() {
        let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
        if (windowWidth > 700)
            this.setState({
                windowWidth: windowWidth,
                fixSidebar: 1,
                showSidebar: true,
                position: 'relative',
                sidebarWidth: 260
            });
        else
            this.setState({
                windowWidth: windowWidth,
                fixSidebar: 0,
                showSidebar: false,
                position: 'fixed',
                sidebarWidth: 0
            })
    }

    showSidebar() {
        this.setState({showSidebar: true, sidebarWidth: 260})
    }

    hideSidebar() {
        if (!this.state.fixSidebar)
            this.setState({showSidebar: false, sidebarWidth: 0})
    }

    render() {
        return (
            <Router>
                <div className="App-header">
                    <Sidebar width={this.state.sidebarWidth.toString() + 'px'}/>
                    <div className="container" onClick={this.showSidebar}>
                        <div className="bar"/>
                        <div className="bar"/>
                        <div className="bar"/>
                    </div>
                    <div className="App-body" onClick={this.hideSidebar}
                         style={{
                             minWidth: this.state.windowWidth - this.state.sidebarWidth * this.state.fixSidebar,
                             position: this.state.position
                         }}>
                        <Switch>
                            <Route path="/create_question" component={QuestionCreator}/>
                            <Route path="/edit_question" component={EditQuestion}/>
                            <Route path="/admin" component={MainPage}/>
                            <Route path="/login" component={Login}/>
                            <Route component={NoMatch}/>
                        </Switch>
                    </div>
                </div>
            </Router>
        );
    }
}

export default App;
