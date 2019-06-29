/* eslint-disable */
import React, {createContext, FC, useContext, useState} from 'react';
import {Label, Message, Transition} from "semantic-ui-react";
import {ErrorPopDown} from "./ErrorPopDown";

export type ErrorContextType = {
    setError: (message: string) => void;
    Display: FC;
};

export const ErrorContext = createContext<ErrorContextType>({
    setError: () => {
    },
    Display: () => <div/>
});

export const ErrorContextProvider = (props) => {
    const [showError, setShowError] = useState(false);
    const [message, setMessage] = useState("" /*"test message: this is a test message that might run over multiple lines"*/);

    const setError = (message) => {
        setShowError(true);
        setMessage(message);
        setTimeout(() => {
            setShowError(false);
        }, 5000);
    };

    // const hideError = () => {
    //     setShowError(false);
    // };

    const Display = () => {
        return <ErrorPopDown visible={showError} message={message}/>
    };

    return <ErrorContext.Provider value={{setError: setError, Display}}>
        {props.children}
    </ErrorContext.Provider>
}