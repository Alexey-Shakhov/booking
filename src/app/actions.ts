'use server'

import { revalidatePath } from 'next/cache'
import { DateTime } from 'luxon'
import {
    getAllRooms, getRoom, createRoom, updateRoom, deleteRoom,
    getAllBookings, createBooking, deleteBooking, hasConflict
} from '@/app/db'

// Room Actions
export async function getRoomsAction() {
    return getAllRooms()
}

export async function addRoomAction(formData: FormData) {
    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const features = (formData.get('features') as string).split(',').map(f => f.trim())

    await createRoom({ name, capacity, features })
    revalidatePath('/')
}

export async function updateRoomAction(id: number, formData: FormData) {
    const name = formData.get('name') as string
    const capacity = parseInt(formData.get('capacity') as string)
    const features = (formData.get('features') as string).split(',').map(f => f.trim())

    await updateRoom(id, { name, capacity, features })
    revalidatePath('/')
}

export async function deleteRoomAction(id: number) {
    await deleteRoom(id)
    revalidatePath('/')
}

// Booking Actions
export async function createBookingAction(formData: FormData, roomId: number) {
    const time_start = formData.get('time-start') as string
    const time_end = formData.get('time-end') as string
    const title = formData.get('title') as string
    const notes = formData.get('notes') as string

    const startUtc = DateTime.fromISO(time_start, { zone: 'local' }).toUTC().toJSDate()
    const endUtc = DateTime.fromISO(time_end, { zone: 'local' }).toUTC().toJSDate()

    const conflict = await hasConflict(roomId, startUtc, endUtc)

    if (conflict) {
        return { success: false, error: 'Time slot conflict' }
    }

    await createBooking({
        resourceType: 'room',
        resourceId: roomId,
        title,
        startUtc,
        endUtc,
        notes
    })

    revalidatePath(`/book/${roomId}`)
    return { success: true }
}

export async function deleteBookingAction(id: number) {
    await deleteBooking(id)
    revalidatePath('/bookings')
}
