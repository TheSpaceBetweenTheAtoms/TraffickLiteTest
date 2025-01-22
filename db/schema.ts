import { pgTable, text, serial, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const flags = pgTable("flags", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  text: text("text").notNull(),
  color: varchar("color", { length: 10 }).notNull(),
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);
export const insertFlagSchema = createInsertSchema(flags);
export const selectFlagSchema = createSelectSchema(flags);

export type InsertDocument = typeof documents.$inferInsert;
export type SelectDocument = typeof documents.$inferSelect;
export type InsertFlag = typeof flags.$inferInsert;
export type SelectFlag = typeof flags.$inferSelect;