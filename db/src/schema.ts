import { uuid, pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";

export const players = pgTable('players', {
    id: uuid('id').primaryKey(),
    username: text('username'),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const matches = pgTable('matches', {
    id: uuid('id').primaryKey(),
    started_at: timestamp('started_at').defaultNow().notNull(),
    ended_at: timestamp('ended_at'), // nullable — null while match is ongoing
});

export const matchPlayers = pgTable('match_players', {
    match_id: uuid('match_id').references(() => matches.id).notNull(),
    player_id: uuid('player_id').references(() => players.id).notNull(),
    kills: integer('kills').notNull().default(0),
    deaths: integer('deaths').notNull().default(0),
    result: text('result'), // nullable, 'win' | 'loss' | 'draw'
});
export const reports = pgTable('reports', {
    id: uuid('id').primaryKey().defaultRandom(),
    reported_player_id: uuid('reported_player_id').references(() => players.id).notNull(),
    match_id: uuid('match_id').references(() => matches.id).notNull(),
    reason: text('reason').notNull(),
    anticheat_flag_id: uuid('anticheat_flag_id').references(() => anticheatFlags.id), // nullable
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const bans = pgTable('bans', {
    id: uuid('id').primaryKey().defaultRandom(),
    player_id: uuid('player_id').references(() => players.id).notNull(),
    ip_address: text('ip_address'), // nullable, for future IP-based enforcement, not implemented yet
    reason: text('reason').notNull(),
    issued_at: timestamp('issued_at').defaultNow().notNull(),
    expires_at: timestamp('expires_at'), // nullable, null = permanent
});

export const anticheatFlags = pgTable('anticheat_flags', {
    id: uuid('id').primaryKey().defaultRandom(),
    player_id: uuid('player_id').references(() => players.id).notNull(),
    match_id: uuid('match_id').references(() => matches.id).notNull(),
    score: real('score').notNull(), // anomaly score from the classifier
    features_json: text('features_json').notNull(),   flagged_at: timestamp('flagged_at').defaultNow().notNull(),
});
