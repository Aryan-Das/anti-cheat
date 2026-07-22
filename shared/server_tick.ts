interface PlayerState{
    player_id : string;
    position : {x : number; y : number};
    alive : boolean;
    connected : boolean;
    health : number;
}

interface ServerTick {
    tick_number : number;
    server_timestamp : number;
    player_states: PlayerState[];
    
}
