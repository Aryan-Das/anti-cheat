import { WebSocket } from 'ws'

export interface PlayerConnection {
    player_id : string;
    tick_joined : number;
    socket_connection : WebSocket; // will be whatever the websocket type ends up being
    position : {x : number; y : number};
    alive : boolean;
    connected : boolean;
    health : number;
    sequence_number : number;
}
