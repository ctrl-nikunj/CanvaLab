import { DrawOp } from '../types'

export function drawStroke(
    ctx: CanvasRenderingContext2D,
    stroke: DrawOp
) {
    if (stroke.points.length < 2) return

    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = stroke.width
    ctx.strokeStyle = stroke.color

    if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
    }

    ctx.beginPath()
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y)

    for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
    }

    ctx.stroke()
    ctx.restore()
}

export function drawSegment(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    options: { color: string; width: number; tool: 'brush' | 'eraser' }
) {
    ctx.save()
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = options.width
    ctx.strokeStyle = options.color

    if (options.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
    }

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
    ctx.restore()
}
