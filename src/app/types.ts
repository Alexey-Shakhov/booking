export interface Room {
    id?: number;
    name: string;
    capacity: number;
    features: string[];
}

export interface Asset {
    id?: number;
    name: string;
    type: 'laptop' | 'projector' | 'other';
}

export interface Booking {
    id?: number;
    resourceId: number;
    resourceType: string;
    title: string;
    notes: string | null;
    startUtc: Date;
    endUtc: Date;
}
