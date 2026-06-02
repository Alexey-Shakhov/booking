"use client";

import type { Room } from "@/app/types"
import Link from 'next/link'
import { deleteRoom } from "./db";

interface RoomCardProps {
    room: Room;
    onEdit: (room: Room) => void;
    onDelete: () => void;
}

export const RoomCard = ({ room, onDelete, onEdit }: RoomCardProps) => {
    const handleDelete = async () => {
        if (confirm(`Удалить кабинет "${room.name}"?`)) {
            await deleteRoom(room.id!);
            onDelete();
        }
    }
    return (
        <tr key={room.id}><td className="*:text-left">{room.id}</td>
            <td className="">{room.name}</td>
            <td className="">{room.capacity}</td>
            <td className="">{room.features.join(' ')}</td>
            <td className=""><Link className="bg-blue-500 text-white p-2 rounded" href={`/book?id=${room.id}`}>
                Забронировать
            </Link></td>
            <td className="">
                <button
                    onClick={() => onEdit(room)}
                    className="bg-yellow-500 text-white p-2 rounded mr-2 hover:bg-yellow-600">
                    Редактировать
                </button>
                <button onClick={handleDelete}
                    className="bg-red-500 text-white p-2 rounded hover:bg-red-600">Удалить
                </button>
            </td>
        </tr>
    );
}

export default RoomCard;
