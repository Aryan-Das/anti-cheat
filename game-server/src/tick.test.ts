import { PlayerConnection } from './types'
import {WebSocket} from 'ws'
import { describe, expect, test } from 'vitest'
import {MAX_SPEED_PER_TICK, runTick, TickResult} from './tick'
import {RecordedInput} from '@game/shared'

function createTestPlayerConnection(override_position = {x:0, y: 0}) : PlayerConnection {
    return {
        player_id: "",
        tick_joined: 0,
        socket_connection: {} as WebSocket,
        position: override_position,
        alive: true,
        connected: true,
        health: 100,
        sequence_number: 0,
    }
}



describe('tick', () => {
    const conn = createTestPlayerConnection();
    const registry : Map<string, PlayerConnection> = new Map();
    registry.set("", conn);
    test('simple movement', () => {
        const input : RecordedInput = {
            player_id: "",
            sequence_number: 0,
            client_timestamp: 0,
            movement: {x: 1, y: 0},
            aim_angle: 0,
            action: null,
            server_timestamp: 0
        };
        const input_buffer : Map<string, RecordedInput> = new Map();
        input_buffer.set("", input);
        const res : TickResult = runTick(registry,input_buffer,0);
        const result_state = res.serverTick.player_states[0];
        expect(result_state.position).toEqual({x:MAX_SPEED_PER_TICK, y:0});
    });


});
