"use client";

import { useEffect, useState } from "react";
import { getAllBookings, getAllRooms, deleteBooking } from "@/app/db";
import { Booking, Room } from "@/app/types";
import { utcToLocalDisplay } from "@/app/utils";
import toast, { Toaster } from "react-hot-toast";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

    const loadData = async () => {
        try {
            const [bookingsData, roomsData] = await Promise.all([
                getAllBookings(),
                getAllRooms()
            ]);

            const mappedBookings: Booking[] = bookingsData.map(booking => ({
                ...booking,
                startUtc: booking.startUtc.toISOString(), // Convert Date to ISO string
                endUtc: booking.endUtc.toISOString(),     // Convert Date to ISO string
                notes: booking.notes ?? null
            }));

            setBookings(mappedBookings);
            setRooms(roomsData);
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Ошибка загрузки данных");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filter bookings by room name
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredBookings(bookings);
        } else {
            const term = searchTerm.toLowerCase().trim();
            const filtered = bookings.filter(booking => {
                const roomName = getRoomName(booking.resourceId).toLowerCase();
                return roomName.includes(term);
            });
            setFilteredBookings(filtered);
        }
    }, [searchTerm, bookings, rooms]);

    const getRoomName = (resourceId: number): string => {
        const room = rooms.find(r => r.id === resourceId);
        return room ? room.name : `Комната ${resourceId}`;
    };

    const handleDelete = async (id: number) => {
        if (confirm("Удалить бронирование?")) {
            try {
                await deleteBooking(id);
                toast.success("Бронирование удалено");
                await loadData(); // Refresh the list
            } catch (error) {
                console.error("Failed to delete:", error);
                toast.error("Ошибка при удалении");
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">Загрузка...</p>
            </div>
        );
    }

    return (
        <div className="p-10">
            <Toaster position="top-center" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-4">Список бронирований</h1>

                <div className="max-w-md">
                    <input
                        type="text"
                        placeholder="Поиск по названию комнаты..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {searchTerm && (
                    <div className="mt-2 text-sm text-gray-600">
                        Найдено: {filteredBookings.length} из {bookings.length}
                    </div>
                )}
            </div>

            {filteredBookings.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    {searchTerm ? "Ничего не найдено" : "Нет бронирований"}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 border text-left">ID</th>
                                <th className="p-3 border text-left">Комната</th>
                                <th className="p-3 border text-left">ID комнаты</th>
                                <th className="p-3 border text-left">Название</th>
                                <th className="p-3 border text-left">Примечания</th>
                                <th className="p-3 border text-left">Начало</th>
                                <th className="p-3 border text-left">Конец</th>
                                <th className="p-3 border text-left">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="p-3 border">{booking.id}</td>
                                    <td className="p-3 border">{getRoomName(booking.resourceId)}</td>
                                    <td className="p-3 border">{booking.resourceId}</td>
                                    <td className="p-3 border">{booking.title}</td>
                                    <td className="p-3 border">{booking.notes || "-"}</td>
                                    <td className="p-3 border">{utcToLocalDisplay(booking.startUtc)}</td>
                                    <td className="p-3 border">{utcToLocalDisplay(booking.endUtc)}</td>
                                    <td className="p-3 border">
                                        <button
                                            onClick={() => handleDelete(booking.id!)}
                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
