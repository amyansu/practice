import { pgTable, uuid, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const todosTable = pgTable('todos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  isComplete: boolean("is_complete").default(false).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
