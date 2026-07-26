import {PlayerConnection} from './types';
import {ServerTick, RecordedInput, PlayerState, MatchEvent, PlayerKilledEvent, ShotFiredEvent} from '@game/shared';
import {WebSocket} from 'ws'
import {detectHit, computeRayEndPoint} from './hit_detection'

export interface TickResult {
    serverTick: ServerTick;
    newTick: number;
    newActiveBuffer: Map<string, RecordedInput>;
    events: MatchEvent[];
}

export const MAX_SPEED_PER_TICK : number = 12.0;
export const DAMAGE = 15.0;
export const MAX_RANGE = 200.0;
export const HIT_RADIUS = 30;
export const SHOT_TICK_COOLDOWN = 10.0;

export function runTick(registry: Map<string, PlayerConnection>, input_buffer: Map<string, RecordedInput>, tick: number): TickResult {
    const newActiveBuffer: Map<string, RecordedInput> = new Map();
    const bufferEntries = [...input_buffer];
    bufferEntries.sort((a: [string, RecordedInput], b: [string, RecordedInput]) => {
        return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
    });
    const events: MatchEvent[] = [];

    bufferEntries.forEach(([shooterId, input]) => {
        if (input.action !== 'fire') return;
        
        const shooter = registry.get(shooterId);
        if (!shooter) return; 
        if (tick - shooter.last_fired_tick < SHOT_TICK_COOLDOWN) return;
        shooter.last_fired_tick = tick;
        
        

        let closestHit: { targetId: string; distance_along_ray: number } | null = null;
        
        registry.forEach((target, targetId) => {
            if (targetId === shooterId) return;        
            if (!target.alive || !target.connected) return; 
            
            const result = detectHit(shooter.position, input.aim_angle, target.position, MAX_RANGE, HIT_RADIUS);
            if (result.hit && (closestHit === null || result.distance_along_ray < closestHit.distance_along_ray)) {
            closestHit = { targetId, distance_along_ray: result.distance_along_ray };
            }
        });
       
        let shotEvent : ShotFiredEvent = {
                type: 'shot_fired',
                tick_number: tick,
                shooter_id: shooterId,
                end_point: computeRayEndPoint(shooter.position, input.aim_angle, MAX_RANGE),
                hit_player_id: null 
        };
        if (closestHit) {
            const hit: { targetId: string; distance_along_ray: number } = closestHit;
            const conn = registry.get(hit.targetId);
            if(!conn) return;
            conn.health -= DAMAGE;
            shotEvent = {
                type: 'shot_fired',
                tick_number: tick,
                shooter_id: shooterId,
                end_point: conn.position,
                hit_player_id: hit.targetId
            };      
            events.push(shotEvent);
            if (conn.health <= 0){
                conn.alive = false;
                const killedEvent : PlayerKilledEvent = {
                    type: 'player_killed',
                    tick_number: tick,
                    victim_id: hit.targetId,
                    killer_id: shooterId
                };
                events.push(killedEvent);
            }

        }
        else events.push(shotEvent);      
    });
    bufferEntries.forEach((element: [string, RecordedInput]) => {
        const connection = registry.get(element[0]);
        if (connection){
            const movement = element[1].movement;
            const length = Math.hypot(movement.x, movement.y);
            const normalizedMovement = (length == 0)? {x:0, y:0} : {x : movement.x / length, y: movement.y / length};
            const delta = MAX_SPEED_PER_TICK;            
            connection.position = {
                x: connection.position.x + normalizedMovement.x * delta,
                y: connection.position.y + normalizedMovement.y * delta
            }

        } else{
            console.log("Could not find connection: " + element[0]);
        }
    });
    const newTick = tick + 1;  
    const states : PlayerState[] = new Array();
    registry.forEach((conn, id) => {
            states.push(toPlayerState(conn));
    });
    const serverTick : ServerTick = {
        type: 'server_tick',
        tick_number : newTick,
        server_timestamp : Date.now(),
        player_states : states,
    };
    return {
        serverTick,
        newTick,
        newActiveBuffer,
        events
    };    
}

function toPlayerState(conn: PlayerConnection) : PlayerState {
    return {
        player_id : conn.player_id,
        position: conn.position,
        alive: conn.alive,
        connected: conn.connected,
        health: conn.health
    }
}

export class MatchState {
    activeBuffer: Map<string, RecordedInput>;
    tick: number;
    constructor() {
        this.activeBuffer = new Map();
        this.tick = 0;
    }
    submitInput(recordedInput: RecordedInput): void {
        this.activeBuffer.set(recordedInput.player_id, recordedInput);
    }
}



export function startTickLoop(registry: Map<string, PlayerConnection>, matchState : MatchState): void {

    setInterval(() => {
        const res : TickResult = runTick(registry, matchState.activeBuffer, matchState.tick);
        matchState.tick = res.newTick;
        matchState.activeBuffer = res.newActiveBuffer;
        const jsonTick = JSON.stringify(res.serverTick);
        const jsonEvents = res.events.map(event => JSON.stringify(event));
        registry.forEach((conn: PlayerConnection)=>{
            if (conn.socket_connection.readyState === WebSocket.OPEN){
                conn.connected = true;
                conn.socket_connection.send(jsonTick);
                jsonEvents.forEach(jsonEvent => conn.socket_connection.send(jsonEvent));            } else{
                conn.connected = false;
            }
        });
    }, 33);
}



