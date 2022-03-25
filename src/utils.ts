/* eslint-disable */
import {ErrorContextType} from "./components/ErrorContextProvider";

export function safeGet<T>(e: gapi.client.calendar.Event, prop: string, defaultValue: T) {
    if (e.extendedProperties && e.extendedProperties.private) {
        return e.extendedProperties.private[prop];
    }
    return defaultValue;
}

export function unpack(e: gapi.client.calendar.Event) {
    if (e.extendedProperties) {
        if (e.extendedProperties.private["cancellationReason"]) {
            return {
                paidOrCancelled: true,
                existingCancellationReason: e.extendedProperties.private["cancellationReason"]
            }
        }
        if (e.extendedProperties.private["paymentId"]) {
            return {
                paidOrCancelled: true,
                existingCancellationReason: undefined
            }
        }
    }
    return {
        paidOrCancelled: false,
        existingCancellationReason: undefined
    }
}

export function report(errors: ErrorContextType, e) {
    console.log(e);
    try {
        errors.setError(e.result.error.message);
    } catch (e) {
        errors.setError("Uknown error. Please try again later");
    }
}

export function attempt(promise: Promise<void>, errors: ErrorContextType) {
    return promise.catch((e) => {
        report(errors, e);
        throw e;
    });
}

export function isLesson(e: gapi.client.calendar.Event) {
    return !(e.extendedProperties && e.extendedProperties.private["paymentAmount"]);
}

export function unpackLocation(calendar: gapi.client.calendar.CalendarListEntry): { initials: string, name: string, nickname: string, amount: number, notes: string } {
    // const meta = calendar.location || "";
    // const [info, notes] = meta.split("------").map(p => p.trim());
    // const [name, amount] = info.split("\n").map(p => p.trim());

    const DEF_META = {initials: "UNK", name: "Unknown", nickname: "Unknown", amount: 0, notes: ""};
    try {
        const meta = JSON.parse(calendar.location!);
        return {
            ...meta,
            amount: Number(meta.amount)
        };
    } catch (e) {
        console.error(e);
        return DEF_META;
    }
}

export function parsePaymentAmount(e: gapi.client.calendar.Event): number {
    if (!e.extendedProperties || !e.extendedProperties.private) {
        console.error("No payment amount on event!", e);
        return 0;
    }
    return Number(e.extendedProperties.private["paymentAmount"]);
}

const dateBeforeFilterFactory = (lag) => {
    return (e: gapi.client.calendar.Event) => {
        const end = Date.parse((e.end.dateTime || e.end.date) as string);
        const now = new Date().getTime();
        return end < now + lag * 3600000;
    }
};

export const dateBeforeNowFilter = dateBeforeFilterFactory(0);

export function amountOf(amountPerLesson: number, e: gapi.client.calendar.Event): number {
    if (isLesson(e)) {
        if ( dateBeforeNowFilter(e) ) {
            const overrideAmount = safeGet(e, "overrideAmount", undefined);
            return overrideAmount === undefined ? -amountPerLesson : -overrideAmount;
        }
        return 0;
    }
    return parsePaymentAmount(e);
}


function gen_dl(headings: string[], data: string[][]) {
    const lastRow = data.length + 1;
    const sumLessons = `SUM(C2..C${lastRow})`;
    const sumPayments = `SUM(D2..D${lastRow})`;
    return "data:application/octet-stream;charset=utf-16le;base64," +
        btoa([headings].concat(data)
            .map(line => line
                .map(cell => '"' + cell
                    .replace(/"/, '"""')
                    .replace(/'/, "'''") + '"'
                ).join(","))
            .concat(`,,=${sumLessons},=${sumPayments},=${sumPayments}+${sumLessons}`)
            .join("\n"));
}

function formatDate(start: { date?: gapi.client.calendar.date, dateTime?: gapi.client.calendar.datetime }): string {
    if (!start.date && !start.dateTime) {
        return "UNKNOWN";
    }
    const date = new Date(start.date || start.dateTime!);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function compareDates(a: gapi.client.calendar.Event, b: gapi.client.calendar.Event) {
    const date1 = a.start.date || a.start.dateTime;
    const date2 = b.start.date || b.start.dateTime;

    if (!date1 || !date2) {
        return 0;
    }
    return date1.localeCompare(date2);
}

export function events_dl(calendar: gapi.client.calendar.CalendarListEntry, events: gapi.client.calendar.Event[]) {
    const headings = ["Date", "Note", "Lessons", "Payments"];
    const {amount: amountPerLesson} = unpackLocation(calendar);

    const data = events
        .sort(compareDates)
        .map(e => {
            const overrideReason = safeGet(e, "overrideReason", "");
            const amount = amountOf(amountPerLesson, e).toString();
            const date = formatDate(e.start);
            return isLesson(e) ? [date, overrideReason, amount, ""] : [date, "", "", amount];
        });

    return gen_dl(headings, data);
}

export async function tax_dl(calendarList: gapi.client.calendar.CalendarListEntry[], year: number) {
    const headings = ["Date", "Pupil", "Lessons", "Payments"];

    const timeMin = new Date(year, 3, 1).toISOString();

    function maxDate() {
        const now = new Date();
        const wanted = new Date(year + 1, 3, 1);
        if (now.getTime() > wanted.getTime()) {
            return wanted;
        }
        return now;
    }

    let data: any[] = [];
    for (const calendar of calendarList) {
        const {amount: amountPerLesson, name} = unpackLocation(calendar);

        // const timeMax = new Date(year + 1, 3, 1).toISOString();
        const r = await gapi.client.calendar.events.list({
            calendarId: calendar.id,
            singleEvents: true,
            timeMin,
            timeMax: maxDate().toISOString()
        });

        const events = r.result.items;

        data = data.concat(events
            .sort(compareDates)
            .map(e => {
                const amount = amountOf(amountPerLesson, e).toString();
                const date = formatDate(e.start);
                return isLesson(e) ? [date, name, amount, ""] : [date, name, "", amount];
            }))
    }
    console.log("data", data);
    return gen_dl(headings, data);
}