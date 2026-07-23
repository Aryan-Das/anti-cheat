

export interface ClientInputMessage{
    player_id: string;
    sequence_number: number;
    client_timestamp: number;
    movement: { x: number; y: number };
    aim_angle: number;
    action: 'fire' | null;
}
   
export interface RecordedInput extends ClientInputMessage {
  server_timestamp: number;
}

