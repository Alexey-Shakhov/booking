"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'
import { DateTime } from "luxon";
import { getAllRooms, getBookingsByRoom, hasConflict, addBooking } from "@/app/db";
import { Room } from '@/app/types';
import toast, { Toaster } from 'react-hot-toast';

export default function Book() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<{ start: DateTime, end: DateTime }[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchParams = useSearchParams()
    const router = useRouter()
    const room_id = searchParams.get('id')

    useEffect(() => {
        const loadRooms = async () => {
            const roomsData = await getAllRooms();
            setRooms(roomsData);
        };
        loadRooms();
    }, []);

    const getRoomName = (resourceId: number): string => {
        const room = rooms.find(r => r.id === resourceId);
        return room ? room.name : `Комната ${resourceId}`;
    };

    const findAvailableSlots = async (
        roomId: number,
        selectedDate: string
    ): Promise<{ start: DateTime, end: DateTime }[]> => {
        // Get existing bookings for this room
        const existingBookings = await getBookingsByRoom(roomId);

        // Convert to local time and filter for selected date
        const roomBookings = existingBookings
            .map(b => ({
                start: DateTime.fromISO(b.startUtc.toString()).toLocal(),
                end: DateTime.fromISO(b.endUtc.toString()).toLocal()
            }))
            .filter(b => b.start.hasSame(DateTime.fromISO(selectedDate), 'day'))
            .sort((a, b) => a.start.toMillis() - b.start.toMillis());

        const availableSlots: { start: DateTime, end: DateTime }[] = [];
        const dayStart = DateTime.fromISO(selectedDate).set({ hour: 9, minute: 0 });
        const dayEnd = DateTime.fromISO(selectedDate).set({ hour: 21, minute: 0 });

        let lastEnd = dayStart;

        for (const booking of roomBookings) {
            if (lastEnd < booking.start) {
                const duration = booking.start.diff(lastEnd, 'minutes').minutes;
                if (duration >= 30) {
                    availableSlots.push({ start: lastEnd, end: booking.start });
                }
            }
            lastEnd = booking.end;
        }

        if (lastEnd < dayEnd) {
            const duration = dayEnd.diff(lastEnd, 'minutes').minutes;
            if (duration >= 30) {
                availableSlots.push({ start: lastEnd, end: dayEnd });
            }
        }

        return availableSlots.slice(0, 3);
    };

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setShowSuggestions(false);

        const time_start = formData.get("time-start") as string;
        const time_end = formData.get("time-end") as string;
        const title = formData.get("title") as string;
        const notes = formData.get("notes") as string;
        const roomId = parseInt(room_id || "0");

        // Validate inputs
        if (!time_start || !time_end || !title) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            setIsSubmitting(false);
            return;
        }

        // Convert local time to UTC for storage
        const startUtc = DateTime.fromISO(time_start, { zone: 'local' }).toUTC().toISO()!;
        const endUtc = DateTime.fromISO(time_end, { zone: 'local' }).toUTC().toISO()!;

        // Check for conflicts
        const conflict = await hasConflict(roomId, startUtc, endUtc);

        if (conflict) {
            toast.error("Ошибка: выбранное время уже забронировано!");

            // Find available slots
            const selectedDateTime = DateTime.fromISO(time_start);
            const slots = await findAvailableSlots(roomId, selectedDateTime.toISODate()!);
            setAvailableSlots(slots);
            setShowSuggestions(true);
            setIsSubmitting(false);
            return;
        }

        // Create booking
        try {
            await addBooking({
                resourceType: "room",
                resourceId: roomId,
                title,
                startUtc,
                endUtc,
                notes: notes
            });

            toast.success("Бронирование успешно создано!");

            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (error) {
            console.error("Booking error:", error);
            toast.error("Ошибка при создании бронирования");
            setIsSubmitting(false);
        }
    }

    const fillSuggestedSlot = (start: DateTime, end: DateTime) => {
        const startInput = document.querySelector('input[name="time-start"]') as HTMLInputElement;
        const endInput = document.querySelector('input[name="time-end"]') as HTMLInputElement;

        startInput.value = start.toFormat("yyyy-MM-dd'T'HH:mm");
        endInput.value = end.toFormat("yyyy-MM-dd'T'HH:mm");

        setShowSuggestions(false);
        toast.success("Время заполнено! Отправьте форму снова.", { duration: 3000 });
    };

    if (!room_id) {
        return <div className="p-10 text-center text-red-500">ID комнаты не указан</div>;
    }

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
            <form action={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
                <h2 className="pb-5 text-xl font-bold">{`Забронировать ${getRoomName(parseInt(room_id))}`}</h2>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="time-start" className="block font-medium mb-1">Время начала: *</label>
                        <input
                            required
                            type="datetime-local"
                            name="time-start"
                            id="time-start"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="time-end" className="block font-medium mb-1">Время окончания: *</label>
                        <input
                            required
                            type="datetime-local"
                            name="time-end"
                            id="time-end"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="title" className="block font-medium mb-1">Название события: *</label>
                        <input
                            required
                            type="text"
                            name="title"
                            id="title"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="notes" className="block font-medium mb-1">Примечания:</label>
                        <textarea
                            name="notes"
                            id="notes"
                            rows={3}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
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
                                    className="w-full text-left text-sm p-2 bg-white border rounded hover:bg-blue-50 transition-colors"
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

                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                    >
                        {isSubmitting ? "Бронирование..." : "Забронировать"}
                    </button>
                </div>
            </form>
        </>
    );
}
