/* eslint-disable */
import React, {useContext, useEffect, useState} from 'react';
import {Dimmer, Item, Loader, Menu, Message, Responsive} from "semantic-ui-react";
import {CalendarItem} from "./CalendarItem";
import {CreateStudent} from "../components/CreateStudent";
import {ErrorContext} from "../components/ErrorContextProvider";
import ButtonLink from "../components/ButtonLink";
import {ReactComponent as Logo} from "../pupil.svg";

export const CalendarList = () => {
    const [calendarList, setCalendarList] = useState<gapi.client.calendar.CalendarListEntry[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [busy, setBusy] = useState(false);
    const [activity, setActivity] = useState();

    const errors = useContext(ErrorContext);

    function pack_location(initials, name, nickname, amount, notes) {
        return JSON.stringify({initials, name, nickname, amount, notes});
    }

    const createStudent = (initials, name, nickname, amount, notes) => {
        setBusy(true);
        setActivity("Creating calendar");
        gapi.client.calendar.calendars.insert({
            summary: "Tutoring: " + initials,
            location: pack_location(initials, name, nickname, amount, notes)
        }).then(r => {
            console.log("Added calendar, setting perms");
            return gapi.client.calendar.acl.insert({
                calendarId: r.result.id,
                role: "freeBusyReader",
                scope: {type: "default"}
            })
        }).then(r => {
            console.log("Done add acl!", r.result);
            setBusy(false);
            setShowCreate(false);
            reload();
        }).catch(() => {
            setBusy(false);
            errors.setError("Create failed!!")
        })
    };

    const updateStudent = (id, initials, name, nickname, amount, notes) => {
        // const {}=params;
        setBusy(true);
        setActivity("Updating calendar");
        gapi.client.calendar.calendars.update({
            calendarId: id,
            summary: "Tutoring: " + initials,
            // location: [name, amount].join("\n") + "\n------\n" + (notes || "")
            location: pack_location(initials, name, nickname, amount, notes)
        }).then(r => {
            setBusy(false);
            reload();
        }).catch(() => {
            setBusy(false);
            errors.setError("Update student failed!!")
        })
    };

    const reload = () => {
        setBusy(true);
        setActivity("Loading calendars");
        gapi.client.calendar.calendarList.list()
            .then(r => {
                setCalendarList(r.result.items
                    .filter(c => c.summary.startsWith("Tutoring:"))
                    .map(c => ({
                        ...c,
                        summary: c.summary.substr("Tutoring: ".length)
                    }))
                );
                setBusy(false);
            })
            .catch((e) => {
                setBusy(false);
                errors.setError("Loading calendars failed: " + e)
            });
    };

    const unauth = () => {
        gapi.auth2.getAuthInstance().signOut();
    };

    useEffect(reload, []);

    return (
        <div>
            <Menu secondary pointing>
                <Menu.Menu>
                    <Menu.Item>
                        <Logo className="pupil-logo" width={40} height={40}/>
                    </Menu.Item>
                    <Menu.Item as={Responsive} minWidth={500}>
                        <span className="site-menu-title">Pupil Diary</span>
                    </Menu.Item>
                </Menu.Menu>
                <Menu.Menu position="right">
                    <Menu.Item>
                        {showCreate || <ButtonLink onClick={() => setShowCreate(true)}>New Student</ButtonLink>}
                    </Menu.Item>
                    <Menu.Item>
                        <ButtonLink onClick={unauth}>Logout</ButtonLink>
                    </Menu.Item>
                </Menu.Menu>
            </Menu>

            <Dimmer active={busy} page={true} inverted>
                <Loader inverted content={activity || "No activity"}/>
            </Dimmer>

            {
                showCreate && <CreateStudent onCancel={() => setShowCreate(false)} onCreateOrUpdate={createStudent}/>
            }

            <Item.Group>
                {
                    calendarList.map(c => <CalendarItem key={c.id} calendar={c} onUpdate={(...args) => updateStudent(c.id, ...args)}/>)
                }
                {
                    !busy && calendarList.length === 0 && !showCreate && <Message>
                        You do not have any students. Click <ButtonLink onClick={() => setShowCreate(true)}>New Student</ButtonLink> to add.
                    </Message>
                }
            </Item.Group>
        </div>
    )
};