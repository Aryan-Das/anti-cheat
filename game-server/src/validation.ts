import {z} from 'zod'

export const ClientInputMessageSchema = z.object({
    player_id: z.string().uuid(),
    sequence_number: z.number(),
    client_timestamp: z.number(),
    movement: z.object({ x: z.number(), y: z.number() }),
    aim_angle: z.number(),
    action: z.union([z.literal('fire'), z.null()])
})
