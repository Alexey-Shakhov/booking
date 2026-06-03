'use server';

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

declare global {
    var prismaGlobal: PrismaClient | undefined
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = globalThis.prismaGlobal ?? new PrismaClient({ adapter })
if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma


// Room operations
export async function getAllRooms() {
    return prisma.room.findMany()
}

export async function getRoom(id: number) {
    return prisma.room.findUnique({ where: { id } })
}

export async function addRoom(data: { name: string; capacity: number; features: string[] }) {
    return prisma.room.create({ data })
}

export async function updateRoom(id: number, data: { name: string; capacity: number; features: string[] }) {
    return prisma.room.update({ where: { id }, data })
}

export async function deleteRoom(id: number) {
    return prisma.room.delete({ where: { id } })
}

// Booking operations
export async function getAllBookings() {
    return prisma.booking.findMany()
}

export async function getBookingsByRoom(roomId: number) {
    return prisma.booking.findMany({
        where: { resourceId: roomId },
        orderBy: { startUtc: 'asc' }
    })
}

export async function addBooking(data: {
    resourceType: string
    resourceId: number
    title: string
    startUtc: Date
    endUtc: Date
    notes?: string
}) {
    return prisma.booking.create({ data })
}

export async function deleteBooking(id: number) {
    return prisma.booking.delete({ where: { id } })
}

export async function hasConflict(roomId: number, startUtc: Date, endUtc: Date): Promise<boolean> {
    const overlappingBookings = await prisma.booking.count({
        where: {
            resourceId: roomId,
            startUtc: { lt: endUtc },
            endUtc: { gt: startUtc }
        }
    })
    return overlappingBookings > 0
}
