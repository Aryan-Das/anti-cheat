import {PlayerConnection} from './types';
import {ServerTick, RecordedInput} from '@game/shared';

interface TickResult {
  serverTick: ServerTick;
  newTick: number;
  newActiveBuffer: Map<string, RecordedInput>;
}
function runTick(registry: Map<string, PlayerConnection>, input_buffer: Map<string, RecordedInput>, tick: number): TickResult {
  // swap buffer
  // sort buffer
  // game logic
  // increment tick
  // build ServerTick
}

setInterval(runTick, 33);


