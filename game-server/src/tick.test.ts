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
   
    test('simple movement', () => {
        const conn = createTestPlayerConnection();
        const registry : Map<string, PlayerConnection> = new Map();
        registry.set("", conn);
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
    test('movement determinism', () => {
        const conn1 = createTestPlayerConnection();
        const registry1 : Map<string, PlayerConnection> = new Map();
        registry1.set("", conn1);  
        const conn2 = createTestPlayerConnection();
        const registry2 : Map<string, PlayerConnection> = new Map();
        registry2.set("", conn2);  
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
        const res1 : TickResult = runTick(registry1,input_buffer,0);
        const result_state1 = res1.serverTick.player_states[0];
        const res2 : TickResult = runTick(registry2,input_buffer,0);
        const result_state2 = res2.serverTick.player_states[0];
        expect(result_state1).toEqual(result_state2);
    });
    test('invalid id', () => {
        const conn = createTestPlayerConnection();
        const registry : Map<string, PlayerConnection> = new Map();
        registry.set("", conn);
        const input1 : RecordedInput = {
            player_id: "",
            sequence_number: 0,
            client_timestamp: 0,
            movement: {x: 1, y: 0},
            aim_angle: 0,
            action: null,
            server_timestamp: 0
        };
        const input2 : RecordedInput = {
            player_id: "some id not in registry",
            sequence_number: 0,
            client_timestamp: 0,
            movement: {x: 6000, y: 0},
            aim_angle: 0,
            action: null,
            server_timestamp: 0
        };
        const input_buffer : Map<string, RecordedInput> = new Map();
        input_buffer.set("", input1);
        input_buffer.set("some id not in registry", input2);
        let res: TickResult;
        expect(() => {
            res = runTick(registry, input_buffer, 0);
        }).not.toThrow();        
        const result_state = res.serverTick.player_states[0];
        expect(res.serverTick.player_states.length).toEqual(1);
        expect(result_state.position).toEqual({x:MAX_SPEED_PER_TICK, y:0});
        
    });
});
