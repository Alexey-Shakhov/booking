import type { Booking } from './types';
import { DateTime, Duration } from 'luxon';

export function localToUtc(localDate: Date, time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const dt = DateTime.fromObject(
        {
            year: localDate.getFullYear(),
            month: localDate.getMonth() + 1,
            day: localDate.getDate(),
            hour: hours,
            minute: minutes,
        },
        { zone: 'local' }
    );

    var ret = dt.toUTC().toISO();
    if (ret) {
        return ret;
    } else {
        return "";
    }
}

export function utcToLocalDisplay(utcString: string): string {
    return DateTime.fromISO(utcString).setZone('local').toFormat('dd-MM-yyyy HH:mm');
}

export function hasConflict(
    newStartUtc: string,
    newEndUtc: string,
    existingBookings: Booking[]
): boolean {
    for (const b of existingBookings) {
        if (newStartUtc < b.endUtc && newEndUtc > b.startUtc) {
            return true;
        }
    }
    return false;
}

export function findConflictingBookings(
    newStartUtc: string,
    newEndUtc: string,
    existing: Booking[]
): Booking[] {
    return existing.filter(b => newStartUtc < b.endUtc && newEndUtc > b.startUtc);
}
