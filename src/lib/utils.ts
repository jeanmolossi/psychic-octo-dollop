import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Price } from "./supabase/supabase.types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type TimeResponse<T, S> = T extends true
        ? S extends number
            ? string
            : string | null
    : Date;

type ToDateTime<T, S = number | null> = {
        secs: S;
        isostring?: T
    }

export const toDateTime = <T extends boolean | undefined, S = number | null>({
    secs,
    isostring
}: ToDateTime<T, S>): TimeResponse<T, S> => {
    if (!secs)
         return null as TimeResponse<T, S>;

    const date = new Date(0)
    const timezone = date.getTimezoneOffset() * 1000 * 60;
    date.setSeconds(secs as number, timezone)

    if (!!isostring)
        return date.toISOString() as TimeResponse<T, S>;
    return date as TimeResponse<T, S>
}

export const postData = async <Res = any>({
    url,
    data
}: {
    url: string;
    data?: { price: Price };
}) => {
    console.log('posting,', url, data);

    const res: Response = await fetch(url, {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'same-origin',
        body: JSON.stringify(data),
    })

    if (!res.ok) {
        console.log('Error in postData', { url, data, res })
        throw Error(res.statusText)
    }

    return (await res.json()) as Res
}

export const getURL = () => {
    let url = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    return url.replace(/\/$/, '')
}

export const toBRL = (price: Price): string => {
    const brl = new Intl.NumberFormat('pt-BR', {
        currency: price.currency || 'brl',
        style: 'currency',
    }).format((price?.unitAmount || 0) / 100)

    return brl
}

function parseStringHourToSeconds(time: string) {
    const [hourStr, minuteStr, secondStr] = time.split(':')

    const hour = +hourStr
    const minute = +minuteStr
    const second = +secondStr

    const hourToSecond = hour * 60 * 60
    const minuteToSecond = minute * 60

    console.log(hourToSecond+minuteToSecond+second+'s')
}

parseStringHourToSeconds('10:24:21')
