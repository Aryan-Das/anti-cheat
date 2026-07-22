interface PlayerJoinedEvent {
    type : 'player_joined';
    tick_number : number;
    player_id : string;
}
interface PlayerLeftEvent {
    type : 'player_left';
    tick_number : number;
    player_id : string;
}
interface PlayerKilledEvent {
    type : 'player_killed';
    tick_number : number;
    victim_id : string;
    killer_id : string;
}

interface MatchStartedEvent {
    type : 'match_started';
    tick_number : number;
}

interface MatchEndedEvent {
    type : 'match_ended';
    tick_number : number;
    scoreboard : Record<string, number>; // player_id to score
}

type MatchEvent = PlayerJoinedEvent | PlayerLeftEvent | PlayerKilledEvent | MatchStartedEvent | MatchEndedEvent;
