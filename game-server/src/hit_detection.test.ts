import {detectHit} from './hit_detection'
import { describe, expect, test } from 'vitest'

describe('detectHit', () => {
    test('direct hit', () => {
        const hit = detectHit(
            {x: 0, y: 0},
            0,
            {x:100, y:0},
            200,
            30
        );
        expect(hit).toEqual({hit: true, perpendicular_dist: 0});
    });
    test('clear miss', () => {
        const hit = detectHit(
            {x: 0, y: 0},
            0,
            {x:100, y:50},
            200,
            30
        );
        expect(hit.hit).toEqual(false);
        expect(hit.perpendicular_dist).toBeCloseTo(50);
    });
    test('target behind', () => {
        const hit = detectHit(
            {x: 0, y: 0},
            0,
            {x:-100, y:0},
            200,
            30
        );
        expect(hit).toEqual({hit: false, perpendicular_dist: -1});
    });
    test('target out of range', () => {
        const hit = detectHit(
            {x: 0, y: 0},
            0,
            {x:300, y:0},
            200,
            30
        );
        expect(hit).toEqual({hit: false, perpendicular_dist: -1});
    });
});
