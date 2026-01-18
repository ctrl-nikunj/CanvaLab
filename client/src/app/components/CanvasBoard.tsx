'use client'

import { useEffect, useRef, useState } from 'react'
import { socket } from '@/app/lib/socket'
import { DrawOp } from '@/app/lib/types'
import { drawStroke, drawSegment } from '@/app/lib/canvas/renderer'
import { v4 as uuid } from 'uuid'

export default function CanvasBoard() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const currentStroke = useRef<DrawOp | null>(null)
    const strokesRef = useRef<DrawOp[]>([])
    const undoneRef = useRef<Set<string>>(new Set())
    const [users, setUsers] = useState<string[]>([])
    const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({})

    function redrawCanvas() {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (const stroke of strokesRef.current) {
            if (undoneRef.current.has(stroke.id)) continue
            drawStroke(ctx, stroke)
        }
    }

    useEffect(() => {
        const ctx = canvasRef.current!.getContext('2d')!
        ctx.clearRect(0, 0, 800, 600)

        socket.connect()
        socket.emit('join:room', { room: 'main', user: uuid() })

        socket.on('canvas:init', ({ ops, undone }) => {
            strokesRef.current = ops
            undoneRef.current = new Set(undone)
            redrawCanvas()
        })

        socket.on('stroke:start', (stroke: DrawOp) => {
            strokesRef.current.push(stroke)
        })

        socket.on('stroke:append', ({ strokeId, points }) => {
            const stroke = strokesRef.current.find(stroke => stroke.id === strokeId)
            if (!stroke) return

            const ctx = canvasRef.current!.getContext('2d')!
            let lastPoint = stroke.points[stroke.points.length - 1]

            for (const point of points) {
                drawSegment(ctx, lastPoint, point, stroke)
                lastPoint = point
            }

            stroke.points.push(...points)
        })

        socket.on('user:join', (userId: string) => {
            setUsers(prev => [...prev, userId])
        })

        socket.on('user:leave', (userId: string) => {
            setUsers(prev => prev.filter(id => id !== userId))
            setCursors(prev => {
                const next = { ...prev }
                delete next[userId]
                return next
            })
        })

        socket.on('room:users', (users: string[]) => {
            setUsers(users)
        })

        socket.on('cursor:move', ({ userId, x, y }) => {
            setCursors(prev => ({ ...prev, [userId]: { x, y } }))
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    socket.on('op:undo', (strokeId: string) => {
        undoneRef.current.add(strokeId)
        redrawCanvas()
    })

    socket.on('op:redo', (strokeId: string) => {
        undoneRef.current.delete(strokeId)
        redrawCanvas()
    })



    function onMouseDown(e: React.MouseEvent) {
        const rect = canvasRef.current!.getBoundingClientRect()
        currentStroke.current = {
            id: uuid(),
            userId: 'me',
            tool: 'brush',
            color: '#fff',
            width: 2,
            points: [{ x: e.clientX - rect.left, y: e.clientY - rect.top }],
            createdAt: Date.now()
        }
        strokesRef.current.push(currentStroke.current)
        socket.emit('stroke:start', currentStroke.current)
    }

    function onMouseMove(e: React.MouseEvent) {
        if (!currentStroke.current) return

        const rect = canvasRef.current!.getBoundingClientRect()
        const point = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const lastPoint = currentStroke.current.points[currentStroke.current.points.length - 1]

        currentStroke.current.points.push(point)

        const ctx = canvasRef.current!.getContext('2d')!
        drawSegment(ctx, lastPoint, point, currentStroke.current)

        socket.emit('stroke:append', {
            strokeId: currentStroke.current.id,
            points: [point]
        })

        socket.emit('cursor:move', point)
    }


    function onMouseUp() {
        if (!currentStroke.current) return
        socket.emit('stroke:end', { strokeId: currentStroke.current.id })
        currentStroke.current = null
    }

    return (
        <>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                style={{ border: '1px solid #ccc' }}
            />

            {/* Cursors Overlay */}
            {Object.entries(cursors).map(([userId, pos]) => (
                <div
                    key={userId}
                    className="absolute w-3 h-3 bg-red-500 rounded-full pointer-events-none"
                    style={{
                        left: pos.x,
                        top: pos.y,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            ))}

            {/* User List */}
            <div className="absolute top-2 left-2 bg-white/80 p-2 rounded shadow">
                <h3 className="font-bold text-sm">Users: {users.length}</h3>
                <ul className="text-xs">
                    {users.map(u => <li key={u}>{u.slice(0, 4)}...</li>)}
                </ul>
            </div>
            <button className="absolute top-2 right-2" onClick={() => socket.emit('op:undo')}>Undo</button>
            <button className="absolute top-20 right-2" onClick={() => socket.emit('op:redo')}>Redo</button>
        </>

    )
}

