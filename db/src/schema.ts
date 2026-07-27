import { uuid, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const players = pgTable('players', {
  id: uuid('id').primaryKey(),
  username: text('username'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});
