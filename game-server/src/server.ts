import {WebSocketServer, WebSocket} from 'ws'
import {PlayerConnection} from './types'
import {MatchState, startTickLoop} from './tick'
import {ClientInputMessageSchema} from './validation'
import {RecordedInput, WelcomeMessage} from '@game/shared'
import { db, matches, players, matchPlayers } from '@game/db'

async function main(): Promise<void> {
     const currentMatchId = crypto.randomUUID();
    await db.insert(matches).values({ id: currentMatchId });

    const registry = new Map<string, PlayerConnection>();
    const matchState = new MatchState();
    startTickLoop(registry, matchState, currentMatchId);

    const wss = new WebSocketServer({port: 8080});
   
    wss.on('connection', async (ws: WebSocket) => {
        const uuid = crypto.randomUUID();
        console.log(uuid);
        const conn : PlayerConnection = {
            player_id: uuid,
            tick_joined: matchState.tick,
            socket_connection: ws,
            position: {x:640, y:360},
            alive: true,
            connected: true,
            health: 100,
            sequence_number: -1,
            last_fired_tick: -1000,
            kills: 0,
            deaths: 0
        }
        registry.set(uuid, conn);
        await db.insert(players).values({ id: uuid }).onConflictDoNothing();
        await db.insert(matchPlayers).values({ match_id: currentMatchId, player_id: uuid });

        const welcome : WelcomeMessage = { type: 'welcome', player_id: uuid };
        ws.send(JSON.stringify(welcome));
        ws.on('message', async (data) => {
            try{
                const message = JSON.parse(data.toString());
                const parsed = ClientInputMessageSchema.safeParse(message);
                if(parsed.success) {
                    // TODO(anti-cheat): if parsed.data.player_id !== uuid, this indicates potential cheating/hacked client
                    const recordedInput : RecordedInput = {
                        player_id: uuid,
                        sequence_number: parsed.data.sequence_number,
                        client_timestamp: parsed.data.client_timestamp,
                        movement: parsed.data.movement,
                        aim_angle: parsed.data.aim_angle,
                        action: parsed.data.action,
                        server_timestamp: Date.now()
                    };
                    matchState.submitInput(recordedInput);
                    
                }else{
                    console.log("Invalid schema");
                }
            }
            catch (err){
                console.log(err);
            }
        });

    });

}
main();
