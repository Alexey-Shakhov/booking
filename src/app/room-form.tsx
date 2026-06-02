'use client'

import { useState } from 'react'
import { addRoomAction, updateRoomAction } from '@/app/actions'
import { Room } from '@/app/types'

interface RoomFormProps {
    room?: Room
    onClose: () => void
    onSuccess: () => void
}

export function RoomForm({ room, onClose, onSuccess }: RoomFormProps) {
    const [name, setName] = useState(room?.name || '')
    const [capacity, setCapacity] = useState(room?.capacity || 0)
    const [features, setFeatures] = useState(room?.features?.join(', ') || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append('name', name)
        formData.append('capacity', capacity.toString())
        formData.append('features', features)

        if (room) {
            await updateRoomAction(room.id!, formData)
        } else {
            await addRoomAction(formData)
        }

        setIsSubmitting(false)
        onSuccess()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {room ? 'Редактировать кабинет' : 'Добавить кабинет'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2">Название</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Вместимость</label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(parseInt(e.target.value))}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Оборудование (через запятую)</label>
                        <input
                            type="text"
                            value={features}
                            onChange={(e) => setFeatures(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
                            Отмена
                        </button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-500 text-white rounded">
                            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
