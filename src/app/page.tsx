import appData from "@/data/rooms.json"
import { RoomCard } from "@/app/room-card"

export default function Home() {
    return (
        <>
            {appData.rooms.map((room) => <h3 key={room.id}>{RoomCard(room)}</h3>)}
        </>
    );
}
