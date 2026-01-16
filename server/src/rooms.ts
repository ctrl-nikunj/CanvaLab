import { Room } from './types'

const rooms = new Map<string, Room>()

export function getRoom(roomId: string): Room {
    let room = rooms.get(roomId)

    if (!room) {
        room = {
            id: roomId,
            users: new Set(),
            canvas: {
                ops: [],
                undone: new Set()
            }
        }
        rooms.set(roomId, room)
    }

    return room
}

export function removeUser(roomId: string, userId: string) {
    const room = rooms.get(roomId)
    if (!room) return

    room.users.delete(userId)

    if (room.users.size === 0) {
        rooms.delete(roomId)
    }
}
