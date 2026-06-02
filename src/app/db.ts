import { openDB, IDBPDatabase, DBSchema } from "idb";
import { Booking, Asset, Room } from "./types";

interface BookingDB extends DBSchema {
    'rooms': {
        key: number;
        value: Room;
        indexes: { 'features': string[] };
    };

    'bookings': {
        key: number;
        value: Booking;
        indexes: { 'resourceId': number };
    };

    'assets': {
        key: number;
        value: Asset;
    };
}

let db: IDBPDatabase<BookingDB> | null = null;
const DBNAME = 'booking-database'

export async function initDB(): Promise<IDBPDatabase<BookingDB>> {
    if (db) return db;

    db = await openDB(DBNAME, 1, {
        upgrade(db) {
            const roomsStore = db.createObjectStore('rooms', {
                keyPath: 'id',
                autoIncrement: true,
            });
            roomsStore.createIndex('features', 'features');

            const assetsStore = db.createObjectStore('assets', {
                keyPath: 'id',
                autoIncrement: true,
            });

            const bookingsStore = db.createObjectStore('bookings', {
                keyPath: 'id',
                autoIncrement: true,
            });
            bookingsStore.createIndex('resourceId', 'resourceId');

            // Add sample rooms
            db.createObjectStore('rooms', { keyPath: 'id', autoIncrement: true });

            // Add sample data after stores are created
            const roomsStore2 = db.objectStoreNames.contains('rooms') ?
                db.transaction('rooms', 'readwrite').objectStore('rooms') : null;

            if (roomsStore2) {
                roomsStore2.add({
                    name: "Кабинет 101",
                    capacity: 25,
                    features: ["whiteboard"]
                });
                roomsStore2.add({
                    name: "Кабинет 102",
                    capacity: 30,
                    features: ["projector", "whiteboard"]
                });
            }
        },
    });

    return db;
}

// Room operations
export async function getAllRooms(): Promise<Room[]> {
    const db = await initDB();
    return db.getAll('rooms');
}

export async function getRoom(id: number): Promise<Room | undefined> {
    const db = await initDB();
    return db.get('rooms', id);
}

export async function addRoom(room: Omit<Room, 'id'>): Promise<number> {
    const db = await initDB();
    return db.add('rooms', room);
}

export async function updateRoom(room: Room, id: number): Promise<void> {
    const db = await initDB();
    await db.put('rooms', room, id);
}

export async function deleteRoom(id: number): Promise<void> {
    const db = await initDB();
    await db.delete('rooms', id);
}

// Booking operations
export async function getAllBookings(): Promise<Booking[]> {
    const db = await initDB();
    return db.getAll('bookings');
}

export async function getBookingsByRoom(roomId: number): Promise<Booking[]> {
    const db = await initDB();
    const index = db.transaction('bookings').store.index('resourceId');
    return index.getAll(roomId);
}

export async function addBooking(booking: Omit<Booking, 'id'>): Promise<number> {
    const db = await initDB();
    return db.add('bookings', booking);
}

export async function updateBooking(booking: Booking): Promise<void> {
    const db = await initDB();
    await db.put('bookings', booking);
}

export async function deleteBooking(id: number): Promise<void> {
    const db = await initDB();
    await db.delete('bookings', id);
}

// Conflict checking
export async function hasConflict(roomId: number, startUtc: string, endUtc: string): Promise<boolean> {
    const bookings = await getBookingsByRoom(roomId);
    return bookings.some(booking => {
        const bookingStart = booking.startUtc;
        const bookingEnd = booking.endUtc;
        return (startUtc < bookingEnd && endUtc > bookingStart);
    });
}

// Asset operations (if needed)
export async function getAllAssets(): Promise<Asset[]> {
    const db = await initDB();
    return db.getAll('assets');
}

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<number> {
    const db = await initDB();
    return db.add('assets', asset);
}
