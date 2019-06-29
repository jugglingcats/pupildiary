/* eslint-disable */
import React, {useState} from 'react';
import {Button} from "semantic-ui-react";
import {CSSTransition} from 'react-transition-group';

import "./ErrorPopDown.css"

type ErrorPopDownProps = {
    message: string,
    visible: boolean
}

export const ErrorPopDown = (props: ErrorPopDownProps) => {
    return <div className="error-popdown">
        <CSSTransition in={props.visible} timeout={300} classNames="error-popdown-alert" unmountOnExit>
            <div className="error-popdown-alert"><span>{props.message}</span></div>
        </CSSTransition>
    </div>
};