export interface PlayerState{
    player_id : string;
    position : {x : number; y : number};
    alive : boolean;
    connected : boolean;
    health : number;
}

export interface ServerTick {
    type: 'server_tick';
    tick_number : number;
    server_timestamp : number;
    player_states: PlayerState[];
    
}

export interface WelcomeMessage {
    type: 'welcome';
    player_id: string;
}
export type ServerMessage = WelcomeMessage | ServerTick;
