import React, {useState} from 'react';
import {Button, Dropdown, DropdownItemProps, Icon, Label, Segment} from 'semantic-ui-react';
import {events_dl, tax_dl} from "../utils";

type TaxReportProps = {
    calendars: gapi.client.calendar.CalendarListEntry[]
    onCancel?: () => void
}

export const TaxReport = (props: TaxReportProps) => {
    const thisYr = new Date().getFullYear();
    const [year, setYear] = useState(thisYr - 1);
    const [generating, setGenerating] = useState(false);

    const options: DropdownItemProps[] = [];
    for (let n = thisYr - 7; n <= thisYr; n++) {
        options.push({
            text: n + "/" + (n + 1),
            value: n
        });
    }

    function generate() {
        setGenerating(true);
        tax_dl(props.calendars, year).then(d => {
            setGenerating(false);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.download = year + "/" + (year + 1) + " pupildiary tax report.csv";
            a.href = d;
            a.click();
        });
    }

    const initials = "XX";

    return <Segment>
        <Label attached="top">Download Tax Reports</Label>
        <div>
            Please select a year: <Dropdown selection options={options} defaultValue={year} onChange={(e, p) => setYear(p.value as number)}/>
            &nbsp;
            <Button loading={generating} className="download-button" icon labelPosition="right" color="teal" as="a" onClick={generate}>Download<Icon name="download"/></Button>
            <Button onClick={props.onCancel}>Close</Button>
        </div>
    </Segment>
};