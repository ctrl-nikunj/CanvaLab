import { Server, Socket } from 'socket.io'
import { getRoom, removeUser } from './rooms'
import { addStroke, appendPoints, undo, redo } from './drawingState'
import { DrawOp } from './types'

export function registerHandlers(io: Server, socket: Socket) {
    let roomId = ''
    let userId = ''

    socket.on('join:room', ({ room, user }) => {
        roomId = room
        userId = user

        const roomState = getRoom(roomId)
        roomState.users.add(userId)

        socket.join(roomId)

        socket.emit('canvas:init', {
            ops: roomState.canvas.ops,
            undone: Array.from(roomState.canvas.undone)
        })

        socket.to(roomId).emit('user:join', userId)
    })

    socket.on('stroke:start', (stroke: DrawOp) => {
        const room = getRoom(roomId)
        addStroke(room.canvas, stroke)
        socket.to(roomId).emit('stroke:start', stroke)
    })

    socket.on('stroke:append', ({ strokeId, points }) => {
        const room = getRoom(roomId)
        appendPoints(room.canvas, strokeId, points)
        socket.to(roomId).emit('stroke:append', { strokeId, points })
    })

    socket.on('stroke:end', ({ strokeId }) => {
        socket.to(roomId).emit('stroke:end', { strokeId })
    })

    socket.on('op:undo', () => {
        const room = getRoom(roomId)
        const id = undo(room.canvas)
        if (id) io.to(roomId).emit('op:undo', id)
    })

    socket.on('op:redo', () => {
        const room = getRoom(roomId)
        const id = redo(room.canvas)
        if (id) io.to(roomId).emit('op:redo', id)
    })

    socket.on('disconnect', () => {
        removeUser(roomId, userId)
        socket.to(roomId).emit('user:leave', userId)
    })
}
