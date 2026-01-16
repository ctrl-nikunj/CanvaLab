import { CanvasState, DrawOp } from './types'

export function addStroke(state: CanvasState, stroke: DrawOp) {
    state.ops.push(stroke)
}

export function appendPoints(
    state: CanvasState,
    strokeId: string,
    points: { x: number; y: number }[]
) {
    const stroke = state.ops.find(op => op.id === strokeId)
    if (!stroke) return
    stroke.points.push(...points)
}

export function undo(state: CanvasState): string | null {
    for (let i = state.ops.length - 1; i >= 0; i--) {
        const id = state.ops[i].id
        if (!state.undone.has(id)) {
            state.undone.add(id)
            return id
        }
    }
    return null
}

export function redo(state: CanvasState): string | null {
    const ids = Array.from(state.undone)
    if (ids.length === 0) return null

    const last = ids[ids.length - 1]
    state.undone.delete(last)
    return last
}
