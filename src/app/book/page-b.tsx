"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'
import { hasConflict } from "../utils";
import { DateTime } from "luxon";
import { getAllBookings, addBooking, getAllRooms } from "../db";
import { Room, Booking } from '../types';
import toast, { Toaster } from 'react-hot-toast';

const findAvailableSlots = (
    existingBookings: Booking[],
    roomId: number,
    selectedDate: string
): { start: DateTime, end: DateTime }[] => {
    const roomBookings = existingBookings
        .filter(b => b.resourceId === roomId)
        .map(b => ({
            start: DateTime.fromISO(b.startUtc).toLocal(),
            end: DateTime.fromISO(b.endUtc).toLocal()
        }))
        .sort((a, b) => a.start.toMillis() - b.start.toMillis());

    const availableSlots: { start: DateTime, end: DateTime }[] = [];

    const dayStart = DateTime.fromISO(selectedDate, { zone: 'local' }).startOf('day').set({ hour: 8 });
    const dayEnd = DateTime.fromISO(selectedDate, { zone: 'local' }).startOf('day').set({ hour: 21 });

    let lastEnd = dayStart;

    for (const booking of roomBookings) {
        if (booking.start.hasSame(dayStart, 'day')) {
            if (lastEnd < booking.start) {
                const duration = booking.start.diff(lastEnd, 'minutes').minutes;
                if (duration >= 30) { // Only suggest slots of 30+ minutes
                    availableSlots.push({ start: lastEnd, end: booking.start });
                }
            }
            lastEnd = booking.end;
        }
    }

    if (lastEnd < dayEnd) {
        const duration = dayEnd.diff(lastEnd, 'minutes').minutes;
        if (duration >= 30) {
            availableSlots.push({ start: lastEnd, end: dayEnd });
        }
    }

    return availableSlots.slice(0, 3); // Return only 3 best options
};

export async function handleBookSubmit(formData: FormData, room_id: string): Promise<boolean> {
    const time_start = formData.get("time-start") as string;
    const time_end = formData.get("time-end") as string;

    const title = formData.get("title") as string;
    const notes = formData.get("notes") as string;

    const utc_start = DateTime.fromISO(time_start).toUTC().toISO()!;
    const utc_end = DateTime.fromISO(time_end).toUTC().toISO()!;

    var bookings = await getAllBookings();
    let room_id_num = parseInt(room_id);
    if (hasConflict(utc_start, utc_end, bookings.filter((b) => (b.resourceId == room_id_num)))) {
        return false;
    } else {
        addBooking(
            {
                resourceType: "room",
                resourceId: room_id_num,
                title: title,
                startUtc: utc_start,
                endUtc: utc_end,
                notes: notes,
            }
        );
        return true;
    }
}

export default function Book() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [availableSlots, setAvailableSlots] = useState<{ start: DateTime, end: DateTime }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const getRooms = async () => {
        const roomsData = await getAllRooms();
        setRooms(roomsData);
    }

    useEffect(() => {
        getRooms();
    }, []);

    const getRoomName = (resourceId: number): string => {
        const room = rooms.find(r => r.id === resourceId);
        return room ? room.name : `Комната ${resourceId}`;
    };

    const searchParams = useSearchParams()
    const room_id = searchParams.get('id')

    async function clientAction(formData: FormData) {
        setShowSuggestions(false);

        const time_start = formData.get("time-start") as string;
        const time_end = formData.get("time-end") as string;

        const result = await handleBookSubmit(formData, room_id ?? "0");

        if (result) {
            toast.success("Бронирование успешно.");
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            toast.error("Ошибка: время уже забронировано!.");

            const allBookings = await getAllBookings();
            const selectedDateTime = DateTime.fromISO(time_start, { zone: 'local' });
            const slots = findAvailableSlots(allBookings, parseInt(room_id!), selectedDateTime.toISODate()!);
            setAvailableSlots(slots);
            setShowSuggestions(true);
        }
    }

    const fillSuggestedSlot = (start: DateTime, end: DateTime) => {
        const startInput = document.querySelector('input[name="time-start"]') as HTMLInputElement;
        const endInput = document.querySelector('input[name="time-end"]') as HTMLInputElement;

        startInput.value = start.toLocal().toFormat("yyyy-MM-dd'T'HH:mm");
        endInput.value = end.toLocal().toFormat("yyyy-MM-dd'T'HH:mm");

        setShowSuggestions(false);
        toast.success("Время заполнено! Отправьте форму снова.", { duration: 3000 });
    };

    return (
        <>
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                    success: {
                        duration: 3000,
                        style: {
                            background: 'green',
                            color: 'white',
                        },
                    },
                    error: {
                        duration: 4000,
                        style: {
                            background: 'red',
                            color: 'white',
                        },
                    },
                }}
            />
            <form action={clientAction} className="">
                <h2 className="pb-5">{`Забронировать ${getRoomName(parseInt(room_id!))}`}</h2>
                <div className="grid grid-cols-[max-content_max-content] [&>*]:pb-5 [&>*]:pr-5">
                    <label htmlFor="time-start">Время начала: </label>
                    <input required type="datetime-local" name="time-start" id="time-start"></input>
                    <label htmlFor="time-end">Время окончания: </label>
                    <input required type="datetime-local" name="time-end" id="time-end"></input>
                    <label htmlFor="title">Название события: </label>
                    <input required type="text" name="title" id="title"></input>
                    <label htmlFor="notes">Примечания: </label>
                    <input type="text" name="notes" id="notes"></input>
                </div>

                {showSuggestions && availableSlots.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-medium text-yellow-800 mb-2">
                            ⚠️ Это время занято. Свободные слоты:
                        </p>
                        <div className="space-y-2">
                            {availableSlots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => fillSuggestedSlot(slot.start, slot.end)}
                                    className="w-full text-left text-sm p-2 bg-white border
                                        rounded hover:bg-blue-50 transition-colors"
                                >
                                    {slot.start.toFormat("HH:mm")} - {slot.end.toFormat("HH:mm")}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSuggestions(false)}
                            className="text-xs text-gray-500 mt-2 hover:text-gray-700"
                        >
                            Закрыть
                        </button>
                    </div>
                )}
                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Забронировать</button>
            </form>
        </>
    );
}
