import React, {useState} from 'react';
import {Form, InputOnChangeData, Label, Segment, TextAreaProps} from "semantic-ui-react";

type CreateStudentProps = {
    id?: string,
    initials?: string,
    name?: string,
    nickname?: string,
    amount?: number,
    notes?: string,
    onCancel?: () => void,
    onCreateOrUpdate: (initials, name, nickName, amount, notes) => void
}

export const CreateStudent = (props: CreateStudentProps) => {
    const [initials, setInitials] = useState(props.initials || "");
    const [name, setName] = useState(props.name || "");
    const [nickname, setNickname] = useState(props.nickname || "");
    const [amount, setAmount] = useState(props.amount || 0);
    const [notes, setNotes] = useState(props.notes || "");

    const setters = {
        initials: setInitials,
        name: setName,
        nickname: setNickname,
        amount: setAmount,
        notes: setNotes
    };

    function change(event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) {
        setters[data.name](data.value);
    }

    function changeNotes(event: React.FormEvent<HTMLTextAreaElement>, data: TextAreaProps) {
        setters.notes(data.value ? data.value.toString() : "");
    }

    function valid() {
        function check(s) {
            return typeof s === "string" && (s as string).length > 0;
        }

        return [initials, name].every(v => check(v)) && amount !== undefined;
    }

    function submit() {
        props.onCreateOrUpdate(initials, name, nickname, amount, notes);
    }

    return <Segment>
        <Label attached="top">{props.initials ? "Update student details" : "Add a new calendar for a student"}</Label>
        <Form>
            <Form.Group widths="3">
                <Form.Input name="initials" width={2} fluid label='Initials / Nickname' placeholder='Initials' value={initials} onChange={change}/>
                <Form.Input name="name" fluid label='Full Name' placeholder='Full name' value={name} onChange={change}/>
                <Form.Input name="nickname" fluid label='Nickname' placeholder='Nickname (optional)' value={nickname} onChange={change}/>
                <Form.Input name="amount" width={2} fluid label='Amount Per Session' placeholder='Amount' value={amount} onChange={change}/>
            </Form.Group>
            <Form.TextArea name="notes" label='Notes' placeholder='Put any additional information here' defaultValue={notes} onChange={changeNotes}/>

            <p>The student's initials will be used for the public visible free/busy version of the calendar. All other details are private.</p>
            <Form.Group>
                <Form.Button type="button" color="green" disabled={!valid()} onClick={submit}>{props.initials ? "Update" : "Create"}</Form.Button>
                {props.id ? <span/> : <Form.Button type="button" onClick={props.onCancel}>Cancel</Form.Button>}
            </Form.Group>
        </Form>
    </Segment>
};