"use client";

import { RoomCard } from "@/app/room-card"
import { getAllRooms, initDB } from "./db";
import { useEffect, useState } from "react";
import { Room } from "./types";
import { RoomForm } from "./room-form";

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
    const [showForm, setShowForm] = useState(false);

    const loadItems = async () => {
        try {
            await initDB();
            const roomsData = await getAllRooms();
            setRooms(roomsData);
        } catch (err) {
            console.log("Failed to load rooms:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadItems();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredRooms(rooms);
        } else {
            const term = searchTerm.toLowerCase().trim();
            const filtered = rooms.filter(room =>
                room.name.toLowerCase().includes(term) ||
                room.features?.some(feature => feature.toLowerCase().includes(term))
            );
            setFilteredRooms(filtered);
        }
    }, [searchTerm, rooms]);

    if (loading) {
        return <p>Loading database...</p>
    }

    const handleEdit = (room: Room) => {
        setEditingRoom(room);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingRoom(undefined);
    };

    const handleFormSuccess = () => {
        loadItems();
    };

    const handleAdd = () => {
        setEditingRoom(undefined);
        setShowForm(true);
    };

    return (
        <div id="page-body" className="">
            <div className="mb-5">
                <button
                    onClick={handleAdd}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                    + Добавить кабинет
                </button>
            </div>

            <div className="mb-5 flex gap-4 items-center">
                <input
                    type="text"
                    placeholder="Поиск по названию или оборудованию..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-md p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => setSearchTerm('')}
                    className="ml-5 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                >Очистить
                </button>
            </div>

            <table className="border-separate border-spacing-4">
                <thead>
                    <tr className="*:text-left">
                        <th>ID</th>
                        <th>Название</th>
                        <th>Вместимость</th>
                        <th>Оборудование</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRooms.map((room) => {
                        return <RoomCard key={room.id} room={room} onDelete={loadItems} onEdit={handleEdit} />;
                    })}
                </tbody>
            </table>

            {showForm && (
                <RoomForm
                    room={editingRoom}
                    onClose={handleFormClose}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
}
