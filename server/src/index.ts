import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { registerHandlers } from './handlers'

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: '*'
    }
})

io.on('connection', socket => {
    registerHandlers(io, socket)
})

server.listen(4000, () => {
    console.log('Server running on http://localhost:4000')
})
