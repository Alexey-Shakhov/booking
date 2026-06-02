"use client";

import { BookingCard } from "@/app/bookings/booking-card"
import { getAllBookings, getAllRooms, initDB } from "../db";
import { useEffect, useState } from "react";
import { Booking, Room } from "../types";

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);

    const loadItems = async () => {
        try {
            await initDB();
            const [bookingsData, roomsData] = await Promise.all([
                getAllBookings(),
                getAllRooms()
            ]);
            setBookings(bookingsData);
            setRooms(roomsData);
        } catch (err) {
            console.log("Failed to load bookings:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadItems();
    }, []);

    if (loading) {
        return <p>Loading database...</p>
    }

    return (
        <div id="page-body" className="">
            <table className="border-separate border-spacing-4">
                <thead>
                    <tr className="*:text-left">
                        <th>ID</th>
                        <th>Название комнаты</th>
                        <th>Тип ресурса</th>
                        <th>Название события</th>
                        <th>Примечания</th>
                        <th>Время начала</th>
                        <th>Время окончания</th>
                    </tr>
                </thead>
                <tbody>
                    {bookings.map((booking) => (
                        <BookingCard rooms={rooms} key={booking.id!} booking={booking} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
