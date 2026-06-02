'use client'

import { useEffect, useState } from 'react'
import { getRoomsAction, deleteRoomAction } from '@/app/actions'
import { RoomCard } from '@/app/room-card'
import { RoomForm } from '@/app/room-form'
import { Room } from '@/app/types'
import { Toaster } from 'react-hot-toast'

export default function Home() {
    const [rooms, setRooms] = useState<Room[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingRoom, setEditingRoom] = useState<Room | undefined>()
    const [searchTerm, setSearchTerm] = useState('')
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([])

    const loadRooms = async () => {
        const data = await getRoomsAction()
        setRooms(data)
        setLoading(false)
    }

    useEffect(() => {
        loadRooms()
    }, [])

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredRooms(rooms)
        } else {
            const term = searchTerm.toLowerCase().trim()
            const filtered = rooms.filter(room =>
                room.name.toLowerCase().includes(term) ||
                room.features?.some(feature => feature.toLowerCase().includes(term))
            )
            setFilteredRooms(filtered)
        }
    }, [searchTerm, rooms])

    const handleDelete = async (id: number) => {
        await deleteRoomAction(id)
        await loadRooms()
    }

    if (loading) return <p>Loading...</p>

    return (
        <div className="p-10">
            <Toaster position="top-center" />

            <div className="mb-5 flex gap-4 items-center">
                <div className="flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Поиск по названию или оборудованию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-green-500 text-white p-2 rounded"
                >
                    + Добавить кабинет
                </button>
            </div>

            <table className="table-auto border">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-3">ID</th>
                        <th className="p-3">Название</th>
                        <th className="p-3">Вместимость</th>
                        <th className="p-3">Оборудование</th>
                        <th className="p-3">Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onEdit={() => {
                                setEditingRoom(room)
                                setShowForm(true)
                            }}
                            onDelete={() => handleDelete(room.id!)}
                        />
                    ))}
                </tbody>
            </table>

            {showForm && (
                <RoomForm
                    room={editingRoom}
                    onClose={() => {
                        setShowForm(false)
                        setEditingRoom(undefined)
                    }}
                    onSuccess={loadRooms}
                />
            )}
        </div>
    )
}
