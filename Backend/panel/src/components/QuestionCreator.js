import React from 'react';
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Axios from 'axios';
import Constants from "../Constants";

class QuestionCreator extends React.Component {
    constructor(props) {
        super(props);
        this.submitForm = this.submitForm.bind(this)
    }
    submitForm(evt) {
        evt.preventDefault();
        console.log(evt.target);
        let formdata = new FormData(this.form);
        console.log(formdata);
        Axios({
            method: 'post',
            url: Constants.URL + '/admin/create_question/',
            headers: { 'content-type': 'multipart/form-data' },
            data: formdata
        }).then(response => {})
            .catch(reason => {
                console.log(reason)
            });
        console.log('submitted')
    }
    render() {
        return (
            <div className="form">
                <Container fluid>
                    <Form ref={el => {this.form = el}} onSubmit={this.submitForm}>
                        <Form.Group controlId="desc">
                            <Form.Label> Enter description for question </Form.Label>
                            <Form.Control type="text" placeholder="Enter description"/>
                        </Form.Group>
                        <Form.Group controlId="answer">
                            <Form.Label> Enter answer to the question</Form.Label>
                            <Form.Control type="text" placeholder="Answer"/>
                        </Form.Group>
                        <Form.Group controlId="image">
                            <Form.Control type="file"/>
                        </Form.Group>
                        <Button block type="submit" variant="success" > submit </Button>
                    </Form>
                </Container>
            </div>
        );
    }
}

export default QuestionCreator;