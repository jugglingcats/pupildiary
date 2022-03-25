/* eslint-disable */
import React, {Fragment, useContext, useEffect, useState} from 'react';
import {Button, Card, Form, Grid, Icon, Label, Loader, Segment} from "semantic-ui-react";
import SemanticDatepicker from "react-semantic-ui-datepickers";

import 'react-semantic-ui-datepickers/dist/react-semantic-ui-datepickers.css';
import {amountOf, attempt, compareDates, dateBeforeNowFilter, events_dl, isLesson, parsePaymentAmount, safeGet, unpackLocation} from "../utils";
import moment from "moment";
import {ErrorContext} from "../components/ErrorContextProvider";
import {CreateStudent} from "../components/CreateStudent";
import {LessonEntry} from "../components/LessonEntry";
import {PaymentEntry} from "../components/PaymentEntry";

function formatDate(date: { date?: string | undefined; dateTime?: string | undefined; timeZone?: string | undefined; }, includeTime: boolean = false) {
    return moment(date.date || date.dateTime).format(includeTime ? 'ddd D MMM, h:mma' : 'D MMM');
}

enum CalendarMode {
    none,
    lessons,
    settings
}

type CalendarItemProps = {
    calendar: gapi.client.calendar.CalendarListEntry,
    onUpdate: (initials, name, nickname, amount, notes) => void
}

function toDateParam(date: Date): string {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
}

function overrideReason(e: gapi.client.calendar.Event) {
    const reason = safeGet(e, "overrideReason", undefined);
    return reason && `(${reason})`
}

type BalanceGridProps = {
    events: gapi.client.calendar.Event[],
    amount: number
    onOverrideLesson: (e: gapi.client.calendar.Event, amount: number, reason: string) => void,
    onResetLesson: (e: gapi.client.calendar.Event) => void,
    onUpdatePayment: (e: gapi.client.calendar.Event, amount: number) => void,
    onDeletePayment: (e: gapi.client.calendar.Event) => void
};

const BalanceGrid = (props: BalanceGridProps) => {
    const totalPayments = props.events
        .reduce((tot, e) => isLesson(e) ? tot : (tot + parsePaymentAmount(e)), 0);

    const totalLessons = props.events
        .filter(dateBeforeNowFilter)
        .reduce((tot, e) => isLesson(e) ? tot - amountOf(props.amount, e) : tot, 0);

    return <Fragment>
        <Grid.Row>
            <Grid.Column computer={3} mobile={7}/>
            <Grid.Column textAlign="right" computer={2} mobile={4}>Lessons</Grid.Column>
            <Grid.Column textAlign="right" computer={2} mobile={5}>Payments</Grid.Column>
        </Grid.Row>
        {props.events
            .map(e => (isLesson(e) ?
                    <Grid.Row key={e.id} className={dateBeforeNowFilter(e) ? "" : "future-lesson"}>
                        <Grid.Column computer={3} mobile={7}>{formatDate(e.start)} {overrideReason(e)}</Grid.Column>
                        <Grid.Column textAlign="right" computer={2} mobile={4}>
                            <LessonEntry event={e} defaultAmount={props.amount} onOverride={(amount, reason) => props.onOverrideLesson(e, amount, reason)}
                                         onReset={() => props.onResetLesson(e)}/>
                        </Grid.Column>
                        <Grid.Column textAlign="right" computer={2} mobile={5}/>
                    </Grid.Row>
                    :
                    <Grid.Row key={e.id} className="payment-row">
                        <Grid.Column computer={3} mobile={7}>{formatDate(e.start)}</Grid.Column>
                        <Grid.Column textAlign="right" computer={2} mobile={4}/>
                        <Grid.Column textAlign="right" computer={2} mobile={5}>
                            <PaymentEntry event={e} onUpdate={(amount) => props.onUpdatePayment(e, amount)} onDelete={() => props.onDeletePayment(e)}/>
                        </Grid.Column>
                    </Grid.Row>
            ))}
        {props.events.length && <Grid.Row>
            <Grid.Column computer={3} mobile={7}><b>Total to date</b></Grid.Column>
            <Grid.Column textAlign="right" computer={2} mobile={4}><b>({totalLessons})</b></Grid.Column>
            <Grid.Column textAlign="right" computer={2} mobile={5}><b>{totalPayments}</b></Grid.Column>
        </Grid.Row>}
    </Fragment>;
};

export const PupilView = (props: CalendarItemProps) => {
    const errors = useContext(ErrorContext);

    const [mode, setMode] = useState<CalendarMode>(CalendarMode.none);
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<gapi.client.calendar.Event[]>([]);
    const [paymentDate, setPaymentDate] = useState();
    const [paymentAmount, setPaymentAmount] = useState();
    const [showAddPayment, setShowAddPayment] = useState(false);

    const MenuLink = (props) => {
        if (props.mode === mode) {
            return <b className="student-menu-link inactive">{props.children}</b>
        }
        return <a className="student-menu-link" onClick={(e) => {
            setMode(props.mode);
            e.preventDefault();
            e.stopPropagation();
        }}>{props.children}</a>
    };
    const MenuSeparator = () => <span className="student-header-sep">|</span>;

    const updateEvent = (lesson: gapi.client.calendar.Event, extendedProperties, suffix?) => {
        setLoading(true);
        return attempt(gapi.client.calendar.events.update({
            calendarId: props.calendar.id,
            eventId: lesson.id,
            resource: {
                summary: suffix !== undefined ? `${nickname ? nickname : name}${suffix.length ? " - " + suffix : ""}` : lesson.summary,
                description: lesson.description,
                start: lesson.start,
                end: lesson.end,
                extendedProperties
            }
        }).then(r => {
            setEvents(events.map(e => {
                if (e.id === lesson.id) {
                    return r.result
                } else {
                    return e;
                }
            }));
            setLoading(false);
        }).catch(e => {
            setLoading(false);
            throw e;
        }), errors);
    };

    const addPayment = () => {
        const start = new Date(paymentDate);
        const startDate = toDateParam(start);

        const extendedProperties = {
            private: {paymentAmount}
        } as any;

        setLoading(true);
        return attempt(gapi.client.calendar.events.insert({
            calendarId: props.calendar.id,
            resource: {
                summary: `PR`,
                start: {dateTime: startDate + "T22:30:00Z"},
                end: {dateTime: startDate + "T22:31:00Z"},
                extendedProperties
            }
        }).then(r => {
            setEvents([r.result].concat(events));
            setShowAddPayment(false);
            setLoading(false);
        }).catch(e => {
            setShowAddPayment(false);
            setLoading(false);
            throw e;
        }), errors);
    };

    const overrideLesson = (lesson: gapi.client.calendar.Event, overrideAmount: number, overrideReason: string) => {
        return updateEvent(lesson, {private: {overrideAmount, overrideReason}}, overrideReason);
    };

    const resetLesson = (lesson: gapi.client.calendar.Event) => {
        return updateEvent(lesson, {}, "");
    };

    const updatePayment = (e: gapi.client.calendar.Event, amount: number) => {
        return updateEvent(e, {private: {paymentAmount: amount}})
    };

    const deletePayment = (e: gapi.client.calendar.Event) => {
        setLoading(true);
        return attempt(gapi.client.calendar.events.delete({
            calendarId: props.calendar.id,
            eventId: e.id
        }).then(() => {
            setEvents(events.filter(existing => existing.id !== e.id));
            setLoading(false);
        }).catch(e => {
            setLoading(false);
            throw e;
        }), errors);
    };

    const populateEvents = (allEvents: gapi.client.calendar.Event[]) => {
        setEvents(allEvents);
    };

    useEffect(() => {
        const now = new Date();
        const DAYS_24_IN_MILLIS = 2073600000;
        const to = new Date(now.getTime() + DAYS_24_IN_MILLIS);
        gapi.client.calendar.events.list({
            calendarId: props.calendar.id,
            singleEvents: true,
            timeMax: to.toISOString()
        }).then(r => {
            setLoading(false);
            populateEvents(r.result.items);
        });
    }, []);

    const validPayment = () => {
        return paymentDate && paymentAmount;
    };

    const {initials, name, nickname, amount, notes} = unpackLocation(props.calendar);
    const balance = events.reduce((tot, e) => tot + amountOf(amount, e), 0);

    function headerClick() {
        if (mode === CalendarMode.none) {
            setMode(CalendarMode.lessons);
        } else {
            setMode(CalendarMode.none);
        }
    }

    return <div className="student">
        <div key="header" onClick={headerClick} className={"student-header-row" + (mode !== CalendarMode.none ? " active" : "")}>
            <span className="student-name">{nickname || name}</span>
            <span style={{whiteSpace: "nowrap"}}>
                    {loading &&
                    <Loader active={true} inline={true} size="tiny"/> ||
                    <span>
                        <MenuLink mode={CalendarMode.lessons}>Balance</MenuLink>
                        <Label basic color={balance >= 0 ? "green" : "red"}>{balance}</Label>
                        <MenuSeparator/>
                        <MenuLink mode={CalendarMode.settings}>Settings</MenuLink>
                    </span>
                    }
            </span>
            {
                mode !== CalendarMode.none &&
                <span className="collapse-icon"><Icon name="angle double up"/></span>
            }

            {!loading && mode !== CalendarMode.none && <hr/>}
        </div>
        {
            !loading && mode !== CalendarMode.none &&
            <div>
                {{
                    [CalendarMode.lessons]:
                        <Fragment>
                            <Grid columns={4} className="compact">
                                {showAddPayment &&
                                <Grid.Column width={16}>
                                    <Form>
                                        <Form.Group className="create-payment">
                                            <SemanticDatepicker onDateChange={setPaymentDate} type="basic"/>
                                            <Form.Input icon onChange={(e, v) => setPaymentAmount(v.value)}>
                                                <input placeholder="Enter amount"/><Icon name="dollar"/>
                                            </Form.Input>
                                            <Form.Button disabled={!validPayment()} onClick={addPayment}>Add</Form.Button>
                                            <Form.Button onClick={() => setShowAddPayment(false)}>Cancel</Form.Button>
                                        </Form.Group>
                                    </Form>
                                </Grid.Column>
                                ||
                                <Grid.Column width={16} textAlign="left">
                                    <Button size="small" basic compact icon="add" labelPosition="right" className="fitted" content="Add Payment"
                                            onClick={() => setShowAddPayment(true)}/>
                                </Grid.Column>}

                                {events.length === 0 ?
                                    <div>No lessons or payments found. Please create at least one calendar entry for this student in Google Calendar to get started (for example a
                                        recurring appointment), after which past lessons will appear here.</div> :
                                    <BalanceGrid events={events.sort(compareDates)} amount={amount} onOverrideLesson={overrideLesson} onResetLesson={resetLesson}
                                                 onUpdatePayment={updatePayment} onDeletePayment={deletePayment}/>
                                }
                            </Grid>
                            <hr/>
                        </Fragment>,

                    [CalendarMode.settings]: <Grid columns={1} className="compact">
                        <Grid.Column width={16}>
                            <CreateStudent id={props.calendar.id} initials={initials} name={name} nickname={nickname} amount={amount} notes={notes}
                                           onCreateOrUpdate={props.onUpdate}/>
                            <Segment>
                                <Label attached="top">Backup Data</Label>
                                <p>Before deleting the calendar for this student you can create a backup by downloading the data as a CSV file.</p>
                                <Card.Group>
                                    <Card>
                                        <Card.Content>
                                            Download student data
                                        </Card.Content>
                                        <Card.Content extra>
                                            <Button className="download-button" icon labelPosition="right" size="medium" as="a" href={events_dl(props.calendar, events)}
                                                    download={`${initials}-tutoring.csv`}>Download<Icon name="download"/></Button>
                                            <span className="download-desc">{events.length} lessons/payments</span>
                                        </Card.Content>
                                    </Card>
                                </Card.Group>
                            </Segment>
                        </Grid.Column></Grid>
                }[mode]}
            </div>
        }
    </div>

};