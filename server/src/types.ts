export type Point = {
    x: number
    y: number
}

export type DrawOp = {
    id: string
    userId: string
    tool: 'brush' | 'eraser'
    color: string
    width: number
    points: Point[]
    createdAt: number
}

export type CanvasState = {
    ops: DrawOp[]
    undone: Set<string>
}

export type Room = {
    id: string
    users: Set<string>
    canvas: CanvasState
}
