import { PlayerConnection } from './types'
import {WebSocket} from 'ws'
import { describe, expect, test } from 'vitest'
import {DAMAGE, MAX_SPEED_PER_TICK, runTick, TickResult} from './tick'
import {RecordedInput} from '@game/shared'

function createTestPlayerConnection(overrides: Partial<PlayerConnection> = {}): PlayerConnection {
  return {
    player_id: "",
    tick_joined: 0,
    socket_connection: {} as WebSocket,
    position: { x: 0, y: 0 },
    alive: true,
    connected: true,
    health: 100,
    sequence_number: 0,
    last_fired_tick: -1000,
    ...overrides,
  };
}

function createFireInput(overrides: Partial<RecordedInput> = {}): RecordedInput {
  return {
    player_id: "",
    sequence_number: 0,
    client_timestamp: 0,
    movement: { x: 0, y: 0 },
    aim_angle: 0,
    action: 'fire',
    server_timestamp: 0,
    ...overrides,
  };
}

describe('runTick hit detection', () => {
  test('basic hit applies damage', () => {
    const shooter = createTestPlayerConnection({ player_id: 'shooter', position: { x: 0, y: 0 } });
    const target = createTestPlayerConnection({ player_id: 'target', position: { x: 100, y: 0 }, health: 100 });
    const registry = new Map([['shooter', shooter], ['target', target]]);
    const buffer = new Map([['shooter', createFireInput({ player_id: 'shooter', aim_angle: 0 })]]);

    const res = runTick(registry, buffer, 0);

    expect(target.health).toBe(100 - DAMAGE);
    const shotEvent = res.events.find(e => e.type === 'shot_fired') as ShotFiredEvent;
    expect(shotEvent).toBeDefined();
    expect(shotEvent.hit_player_id).toBe('target');
    expect(res.events.find(e => e.type === 'player_killed')).toBeUndefined();
  });

  test('miss produces shot event with no damage', () => {
    const shooter = createTestPlayerConnection({ player_id: 'shooter', position: { x: 0, y: 0 } });
    const target = createTestPlayerConnection({ player_id: 'target', position: { x: 100, y: 1000 }, health: 100 });
    const registry = new Map([['shooter', shooter], ['target', target]]);
    const buffer = new Map([['shooter', createFireInput({ player_id: 'shooter', aim_angle: 0 })]]);

    const res = runTick(registry, buffer, 0);

    expect(target.health).toBe(100);
    const shotEvent = res.events.find(e => e.type === 'shot_fired') as ShotFiredEvent;
    expect(shotEvent).toBeDefined();
    expect(shotEvent.hit_player_id).toBeNull();
  });

  test('lethal hit marks target dead and emits kill event', () => {
    const shooter = createTestPlayerConnection({ player_id: 'shooter', position: { x: 0, y: 0 } });
    const target = createTestPlayerConnection({ player_id: 'target', position: { x: 100, y: 0 }, health: DAMAGE });
    const registry = new Map([['shooter', shooter], ['target', target]]);
    const buffer = new Map([['shooter', createFireInput({ player_id: 'shooter', aim_angle: 0 })]]);

    const res = runTick(registry, buffer, 0);

    expect(target.alive).toBe(false);
    const killEvent = res.events.find(e => e.type === 'player_killed') as PlayerKilledEvent;
    expect(killEvent).toBeDefined();
    expect(killEvent.victim_id).toBe('target');
    expect(killEvent.killer_id).toBe('shooter');
  });

  test('cooldown blocks repeated fire', () => {
    const shooter = createTestPlayerConnection({ player_id: 'shooter', position: { x: 0, y: 0 }, last_fired_tick: 95 });
    const target = createTestPlayerConnection({ player_id: 'target', position: { x: 100, y: 0 }, health: 100 });
    const registry = new Map([['shooter', shooter], ['target', target]]);
    const buffer = new Map([['shooter', createFireInput({ player_id: 'shooter', aim_angle: 0 })]]);

    const res = runTick(registry, buffer, 100); // 100 - 95 = 5 ticks elapsed < SHOT_TICK_COOLDOWN

    expect(target.health).toBe(100);
    expect(res.events.find(e => e.type === 'shot_fired')).toBeUndefined();
  });

  test('dead target cannot be hit', () => {
    const shooter = createTestPlayerConnection({ player_id: 'shooter', position: { x: 0, y: 0 } });
    const target = createTestPlayerConnection({ player_id: 'target', position: { x: 100, y: 0 }, health: 100, alive: false });
    const registry = new Map([['shooter', shooter], ['target', target]]);
    const buffer = new Map([['shooter', createFireInput({ player_id: 'shooter', aim_angle: 0 })]]);

    const res = runTick(registry, buffer, 0);

    expect(target.health).toBe(100);
    const shotEvent = res.events.find(e => e.type === 'shot_fired') as ShotFiredEvent;
    expect(shotEvent.hit_player_id).toBeNull();
  });

  test('closest target is hit, not the farther one', () => {
    const shooter = createTestPlayerConnection({ player_id: 'shooter', position: { x: 0, y: 0 } });
    const near = createTestPlayerConnection({ player_id: 'near', position: { x: 50, y: 0 }, health: 100 });
    const far = createTestPlayerConnection({ player_id: 'far', position: { x: 150, y: 0 }, health: 100 });
    const registry = new Map([['shooter', shooter], ['near', near], ['far', far]]);
    const buffer = new Map([['shooter', createFireInput({ player_id: 'shooter', aim_angle: 0 })]]);

    const res = runTick(registry, buffer, 0);

    expect(near.health).toBe(100 - DAMAGE);
    expect(far.health).toBe(100);
    const shotEvent = res.events.find(e => e.type === 'shot_fired') as ShotFiredEvent;
    expect(shotEvent.hit_player_id).toBe('near');
  });
});


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
