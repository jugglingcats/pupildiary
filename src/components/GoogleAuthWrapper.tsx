/* eslint-disable */

import React, {useEffect, useState} from 'react';
import {Card, Container, Dimmer, Grid, Header, Loader} from "semantic-ui-react";

import {ReactComponent as Logo} from '../pupil.svg';
import {GoogleButton} from "./GoogleButton";

enum AuthMode {
    loading,
    auth,
    noauth
}

export const GoogleAuthWrapper = (props) => {
    const [authMode, setAuthMode] = useState<AuthMode>(AuthMode.loading);

    const [, setLoggedIn] = useState(false);
    const [, setLoaded] = useState(false);

    const updateSigninStatus = (value: boolean) => {
        console.log("Logged in status changed!", value);
        setLoggedIn(value);
        setAuthMode(value ? AuthMode.auth : AuthMode.noauth);

        // setUserId(gapi.auth2.getAuthInstance().currentUser.get().getId());
        console.log("User id changed")
    };

    useEffect(() => {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js?onload=onGapiLoad';

        (window as any).onGapiLoad = () => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    'clientId': "119947248439-ktto5bclckmr1h3o2grroe6544p4pgin.apps.googleusercontent.com",
                    'scope': 'https://www.googleapis.com/auth/calendar',
                }).then(() => {
                    return gapi.client.load("calendar", "v3")
                }).then(() => {
                    setLoaded(true);
                    console.log("GAPI DONE INIT");
                    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
                    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
                }).catch((e) => {
                    console.error("Failed!", e);
                });
            });
        };
        document.body.appendChild(gapiScript);
    }, []);

    const auth = () => {
        return gapi.auth2.getAuthInstance().signIn();
    };

    return {
        [AuthMode.loading]: <Dimmer active={true} page={true} inverted><Loader inverted content="Initializing"/></Dimmer>,
        [AuthMode.auth]: <div>
            {props.children}
        </div>,
        [AuthMode.noauth]: <Container><Grid textAlign='center' style={{height: '100%'}} verticalAlign='middle'>
            <Grid.Column>
                <Card fluid className="site-title">
                    <Card.Content>
                        <Header as="h1" className="site-title" textAlign="center">
                            <div><Logo className="pupil-logo" width={100} height={100}/></div>
                            <p>Log in to Pupil Diary</p>
                        </Header>
                        <div className="site-intro">
                            <p>
                                Designed for personal tutors, Pupil Diary helps you plan and keep track of your lessons and payments.
                            </p>
                            <p>
                                Pupil Diary uses Google Calendar; all you need is a Google account to get started. We don't store or use any of your
                                personal details such as email and we don't have access to your pupil data. We just provide some nifty features on top of Google
                                calendar.
                            </p>
                            <p>&nbsp;</p>
                            <p>
                                The first time you log in you will be asked to authorize Pupil Diary for use with
                                Google calendar.
                            </p>
                        </div>
                    </Card.Content>
                    <Card.Content extra>
                        <GoogleButton onClick={auth}/>
                    </Card.Content>
                </Card>
            </Grid.Column>
        </Grid></Container>,
    }[authMode]
};