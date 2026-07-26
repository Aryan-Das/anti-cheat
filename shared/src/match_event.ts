export interface PlayerJoinedEvent {
    type : 'player_joined';
    tick_number : number;
    player_id : string;
}
export interface PlayerLeftEvent {
    type : 'player_left';
    tick_number : number;
    player_id : string;
}
export interface PlayerKilledEvent {
    type : 'player_killed';
    tick_number : number;
    victim_id : string;
    killer_id : string;
}

export interface MatchStartedEvent {
    type : 'match_started';
    tick_number : number;
}

export interface MatchEndedEvent {
    type : 'match_ended';
    tick_number : number;
    scoreboard : Record<string, number>; // player_id to score
}

export interface ShotFiredEvent {
    type: 'shot_fired';
    tick_number: number;
    shooter_id: string;
    end_point: { x: number; y: number };
    hit_player_id: string | null;
}

export type MatchEvent = PlayerJoinedEvent | PlayerLeftEvent | PlayerKilledEvent | MatchStartedEvent | MatchEndedEvent | ShotFiredEvent;
