'use client';

import { DateTime } from 'luxon'
import {
    getAllRooms, getRoom, addRoom, updateRoom, deleteRoom,
    getAllBookings, addBooking, deleteBooking, hasConflict
} from '@/app/db'

// Room Actions
export async function getRoomsAction() {
    return getAllRooms()
}

export async function addRoomAction(formData: FormData) {
    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const features = (formData.get('features') as string).split(',').map(f => f.trim())

    await addRoom({ name, capacity, features })
}

export async function updateRoomAction(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const features = (formData.get('features') as string).split(',').map(f => f.trim())

    await updateRoom({ name, capacity, features }, id)
}

export async function deleteRoomAction(id: number) {
    await deleteRoom(id)
}

// Booking Actions
export async function createBookingAction(formData: FormData, roomId: number) {
    const time_start = formData.get('time-start') as string
    const time_end = formData.get('time-end') as string
    const title = formData.get('title') as string
    const notes = formData.get('notes') as string

    const startUtc = DateTime.fromISO(time_start, { zone: 'local' }).toUTC().toString()
    const endUtc = DateTime.fromISO(time_end, { zone: 'local' }).toUTC().toString()

    const conflict = await hasConflict(roomId, startUtc, endUtc)

    if (conflict) {
        return { success: false, error: 'Time slot conflict' }
    }

    await addBooking({
        resourceType: 'room',
        resourceId: roomId,
        title,
        startUtc,
        endUtc,
        notes
    })

    return { success: true }
}

export async function deleteBookingAction(id: number) {
    await deleteBooking(id)
}
