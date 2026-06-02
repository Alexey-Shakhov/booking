"use client";

import type { Booking, Room } from "@/app/types"
import { utcToLocalDisplay } from "../utils";
import { deleteBooking } from "../db";
import { useState } from "react";

interface BookingCardProps {
    booking: Booking;
    rooms: Room[]; // Add rooms prop
}

export const BookingCard = ({ booking, rooms }: BookingCardProps) => {
    const [deleted, setDeleted] = useState(false);

    const deleteThisBooking = (id: number) => {
        setDeleted(true);
        deleteBooking(id);
    }

    const getRoomName = (resourceId: number): string => {
        const room = rooms.find(r => r.id === resourceId);
        return room ? room.name : `Комната ${resourceId}`;
    };

    if (deleted) {
        return (
            <tr>
                <td>Удалено</td>
            </tr>
        );
    }
    return (
        <tr key={booking.id}><td className="*:text-left">{booking.id}</td>
            <td className="">{getRoomName(booking.resourceId)}</td>
            <td className="">{booking.resourceType}</td>
            <td className="">{booking.title}</td>
            <td className="">{booking.notes}</td>
            <td className="">{utcToLocalDisplay(booking.startUtc)}</td>
            <td className="">{utcToLocalDisplay(booking.endUtc)}</td>
            <td className=""><button className="bg-blue-500 text-white p-2 rounded"
                onClick={() => deleteThisBooking(booking.id!)}>
                Удалить
            </button></td>
        </tr>
    );
}

export default BookingCard;
