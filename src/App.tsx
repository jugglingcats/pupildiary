/* eslint-disable */

import React, {useContext} from 'react';
import {Container, Menu, Message} from "semantic-ui-react";
import {CalendarList} from "./views/CalendarList";
import {GoogleAuthWrapper} from "./components/GoogleAuthWrapper";
import {ErrorContext, ErrorContextProvider} from "./components/ErrorContextProvider";
import {ReactComponent as Logo} from './pupil.svg';

import "./App.css"
import {ErrorPopDown} from "./components/ErrorPopDown";
import ButtonLink from "./components/ButtonLink";

const Test = () => <div>Hello</div>

const App: React.FC = () => {
    const Errors = () => {
        const errors = useContext(ErrorContext);
        return <errors.Display/>
    };

    return (
        <GoogleAuthWrapper dev={false} loggedIn={false}>
            <ErrorContextProvider>
                <Errors/>
                <Container>
                    <CalendarList/>
                </Container>
            </ErrorContextProvider>
        </GoogleAuthWrapper>
    );
};

export default App;
