/* eslint-disable */
import React, { useContext, useEffect, useState } from "react"
import { Button, Dimmer, Dropdown, Item, Loader, Menu, Message } from "semantic-ui-react"
import { PupilView } from "./PupilView"
import { CreateStudent } from "../components/CreateStudent"
import { ErrorContext } from "../components/ErrorContextProvider"
import ButtonLink from "../components/ButtonLink"
import { ReactComponent as Logo } from "../pupil.svg"
import { ReactComponent as MenuIcon } from "../menu.svg"
import { TaxReport } from "../components/TaxReport"

console.log("LOGO", Logo)

export const CalendarList = () => {
    const [calendarList, setCalendarList] = useState<gapi.client.calendar.CalendarListEntry[]>([])
    const [showCreate, setShowCreate] = useState(false)
    const [showTaxReports, setShowTaxReports] = useState(false)
    const [busy, setBusy] = useState(false)
    const [activity, setActivity] = useState<string>()

    const errors = useContext(ErrorContext)

    function pack_location(initials, name, nickname, amount, notes) {
        return JSON.stringify({ initials, name, nickname, amount, notes })
    }

    const createStudent = (initials, name, nickname, amount, notes) => {
        setBusy(true)
        setActivity("Creating calendar")
        gapi.client.calendar.calendars
            .insert({
                // @ts-ignore
                summary: "Tutoring: " + initials,
                location: pack_location(initials, name, nickname, amount, notes)
            })
            .then(r => {
                console.log("Added calendar, setting perms")
                return gapi.client.calendar.acl.insert({
                    // @ts-ignore
                    calendarId: r.result.id,
                    role: "freeBusyReader",
                    scope: { type: "default" }
                })
            })
            .then(r => {
                console.log("Done add acl!", r.result)
                setBusy(false)
                setShowCreate(false)
                reload()
            })
            .catch(() => {
                setBusy(false)
                errors.setError("Create failed!!")
            })
    }

    const updateStudent = (id, initials, name, nickname, amount, notes) => {
        // const {}=params;
        setBusy(true)
        setActivity("Updating calendar")
        gapi.client.calendar.calendars
            .update({
                calendarId: id,
                // @ts-ignore
                summary: "Tutoring: " + initials,
                location: pack_location(initials, name, nickname, amount, notes)
            })
            .then(r => {
                setBusy(false)
                reload()
            })
            .catch(() => {
                setBusy(false)
                errors.setError("Update student failed!!")
            })
    }

    const reload = () => {
        setBusy(true)
        setActivity("Loading calendars")
        gapi.client.calendar.calendarList
            .list()
            .then(r => {
                setCalendarList(
                    r.result
                        .items!.filter(c => c.summary?.startsWith("Tutoring:"))
                        .map(c => ({
                            ...c,
                            summary: c.summary?.substring("Tutoring: ".length)
                        }))
                )
                setBusy(false)
            })
            .catch(e => {
                setBusy(false)
                errors.setError("Loading calendars failed: " + e)
            })
    }

    const unauth = () => {
        gapi.auth2.getAuthInstance().signOut()
    }

    useEffect(reload, [])

    return (
        <div>
            <Menu secondary pointing>
                <Menu.Menu>
                    <Menu.Item>
                        <Logo className="pupil-logo" width={40} height={40} viewBox="0 0 420.609 420.609" />
                    </Menu.Item>
                    <Menu.Item>
                        <span className="site-menu-title">Pupil Diary</span>
                    </Menu.Item>
                </Menu.Menu>
                {/*
                <Responsive as={Menu.Menu} position="right" maxWidth={800}>
                    <Menu.Item>
                        <Dropdown icon={<MenuIcon width={24} height={24}/>}>
                            <Dropdown.Menu>
                                <Dropdown.Item text="Tax Reports" onClick={() => setShowTaxReports(true)}/>
                                <Dropdown.Item text="New Student" onClick={() => setShowCreate(true)}/>
                                <Dropdown.Item text="Logout" onClick={unauth}/>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Menu.Item>
                </Responsive>
*/}
                {/*
                <Responsive as={Menu.Menu} position="right" minWidth={800}>
*/}
                <Menu.Menu position="right">
                    <Menu.Item>
                        <ButtonLink onClick={() => setShowTaxReports(true)}>Tax Reports</ButtonLink>
                    </Menu.Item>
                    <Menu.Item>
                        <ButtonLink onClick={() => setShowCreate(true)}>New Student</ButtonLink>
                    </Menu.Item>
                    <Menu.Item>
                        <ButtonLink onClick={unauth}>Logout</ButtonLink>
                    </Menu.Item>
                </Menu.Menu>
                {/*
                </Responsive>
*/}
            </Menu>

            <Dimmer active={busy} page={true} inverted>
                <Loader inverted content={activity || "No activity"} />
            </Dimmer>

            {showCreate && <CreateStudent onCancel={() => setShowCreate(false)} onCreateOrUpdate={createStudent} />}
            {showTaxReports && <TaxReport calendars={calendarList} onCancel={() => setShowTaxReports(false)} />}

            <Item.Group>
                {calendarList.map(c => (
                    <PupilView key={c.id} calendar={c} onUpdate={(...args) => updateStudent(c.id, ...args)} />
                ))}
                {!busy && calendarList.length === 0 && !showCreate && (
                    <Message>
                        You do not have any students. Click{" "}
                        <ButtonLink onClick={() => setShowCreate(true)}>New Student</ButtonLink> to add.
                    </Message>
                )}
            </Item.Group>
        </div>
    )
}
