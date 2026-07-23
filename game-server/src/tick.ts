import {PlayerConnection} from './types';
import {ServerTick, RecordedInput, PlayerState} from '@game/shared';
import {WebSocket} from 'ws'

export interface TickResult {
  serverTick: ServerTick;
  newTick: number;
  newActiveBuffer: Map<string, RecordedInput>;
}

const MAX_SPEED_PER_TICK : number = 5.0;

function runTick(registry: Map<string, PlayerConnection>, input_buffer: Map<string, RecordedInput>, tick: number): TickResult {
    const newActiveBuffer: Map<string, RecordedInput> = new Map();
    const bufferEntries = [...input_buffer];
    bufferEntries.sort((a: [string, RecordedInput], b: [string, RecordedInput]) => {
        return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
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
    // TODO: hit detection / game logic
    const newTick = tick + 1;  
    const states : PlayerState[] = new Array();
    registry.forEach((conn, id) => {
            states.push(toPlayerState(conn));
    });
    const serverTick : ServerTick = {
        tick_number : newTick,
        server_timestamp : Date.now(),
        player_states : states
    };
    return {
        serverTick,
        newTick,
        newActiveBuffer
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
        registry.forEach((conn: PlayerConnection)=>{
            if (conn.socket_connection.readyState === WebSocket.OPEN){
                conn.connected = true;
                conn.socket_connection.send(jsonTick);
            } else{
                conn.connected = false;
            }
        });
    }, 33);
}



