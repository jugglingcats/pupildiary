import * as React from "react";
import {useState} from "react";
import {Button, Confirm, Form, Header, Input, Modal} from "semantic-ui-react";
import {safeGet} from "../utils";

type PaymentEntryProps = {
    event: gapi.client.calendar.Event;
    onUpdate: (amount: number) => void;
    onDelete: () => void;
};

export const PaymentEntry = (props: PaymentEntryProps) => {
    const [showEditPayment, setShowEditPayment] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [amount, setAmount] = useState(safeGet<number>(props.event, "paymentAmount", 0));

    function save() {
        props.onUpdate(amount);
        setShowEditPayment(false);
    }

    function delete_payment() {
        setShowEditPayment(false);
        setConfirmDelete(true);
    }

    function cancel() {
        setShowEditPayment(false);
    }

    const paymentAmount = safeGet(props.event, "paymentAmount", undefined);

    return <React.Fragment>
        <button className="button-link" onClick={() => setShowEditPayment(true)}>{paymentAmount}</button>
        <Confirm open={confirmDelete} content="Confirm you want to delete this payment" onConfirm={props.onDelete} onCancel={() => setConfirmDelete(false)}/>
        <Modal
            open={showEditPayment}
            closeOnDimmerClick={true}
            closeOnEscape={true}
            closeOnDocumentClick={true}>
            <Header icon='edit' content='Edit Payment'/>
            <Modal.Content>
                <Form>
                    <Form.Group widths="equal">
                        <Form.Field width={16}
                                    control={Input}
                                    value={amount}
                                    label="Payment amount"
                                    onChange={(e, v) => setAmount(v.value)}
                                    size="small"
                                    placeholder="Enter new amount"/>
                    </Form.Group>
                </Form>
            </Modal.Content>
            <Modal.Actions>
                <Button size="small" onClick={save} basic>Save</Button>
                <Button size="small" onClick={delete_payment} basic>Delete</Button>
                <Button size="small" onClick={cancel} basic>Cancel</Button>
            </Modal.Actions>
        </Modal>

    </React.Fragment>
};
