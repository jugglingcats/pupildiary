import * as React from "react";
import {useState} from "react";
import {Button, Confirm, Form, Header, Input, Modal} from "semantic-ui-react";
import {safeGet} from "../utils";

type LessonEntryProps = {
    event: gapi.client.calendar.Event;
    defaultAmount: number,
    onOverride: (amount: number, reason: string) => void;
    onReset: () => void;
};

export const LessonEntry = (props: LessonEntryProps) => {
    const [confirmReset, setConfirmReset] = useState(false);
    const [showEditLesson, setShowEditLesson] = useState(false);
    const [editReason, setEditReason] = useState(safeGet<string>(props.event, "overrideReason", ""));
    const [amount, setAmount] = useState(safeGet<number>(props.event, "overrideAmount", 0));

    function override() {
        props.onOverride(amount, editReason);
        setShowEditLesson(false);
    }

    function reset() {
        props.onReset();
        setShowEditLesson(false);
    }

    function cancel() {
        setShowEditLesson(false);
    }

    const overrideAmount = safeGet(props.event, "overrideAmount", undefined);

    const OverrideIcon = () => {
        return overrideAmount === undefined ? <span/> : <span>* </span>;
    };

    return <React.Fragment>
        <button className="button-link" onClick={() => setShowEditLesson(true)}><OverrideIcon/>({overrideAmount === undefined ? props.defaultAmount : overrideAmount})</button>
        <Confirm open={confirmReset} content="Confirm you want to reset this lesson the default charge" onConfirm={props.onReset} onCancel={() => setConfirmReset(false)}/>
        <Modal
            open={showEditLesson}
            closeOnDimmerClick={true}
            closeOnEscape={true}
            closeOnDocumentClick={true}>
            <Header icon='edit' content='Edit Lesson'/>
            <Modal.Content>
                <Form>
                    <Form.Group widths="equal">
                        <Form.Field width={16}
                                    control={Input}
                                    value={amount}
                                    label="Amount for lesson"
                                    onChange={(e, v) => setAmount(v.value)}
                                    size="small"
                                    placeholder="Enter new amount"/>
                        <Form.Field width={16}
                                    control={Input}
                                    value={editReason}
                                    label="Reason"
                                    onChange={(e, v) => setEditReason(v.value)}
                                    size="small"
                                    placeholder="Enter reason"/>
                    </Form.Group>
                </Form>
            </Modal.Content>
            <Modal.Actions>
                <Button size="small" onClick={override} basic>Save</Button>
                <Button size="small" onClick={reset} basic>Reset</Button>
                <Button size="small" onClick={cancel} basic>Cancel</Button>
            </Modal.Actions>
        </Modal>

    </React.Fragment>
};
