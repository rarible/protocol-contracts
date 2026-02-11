/**
 * EXAMPLE: Drizzle ORM schema for LiveDrops in BFF
 * Copy and adapt to your existing schema setup.
 */
import { pgTable, text, timestamp, integer, varchar, index } from "drizzle-orm/pg-core";

/**
 * Drops table: streamId → collectionAddress mapping
 */
export const drops = pgTable(
  "drops",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    streamId: text("stream_id").notNull().unique(),
    collectionAddress: varchar("collection_address", { length: 42 }).notNull(),
    creator: varchar("creator", { length: 42 }).notNull(),
    name: text("name").notNull(),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    txHash: varchar("tx_hash", { length: 66 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    streamIdx: index("drops_stream_id_idx").on(table.streamId),
    collectionIdx: index("drops_collection_address_idx").on(table.collectionAddress),
  })
);

/**
 * Mint transactions table: history of all mint attempts
 */
export const mintTransactions = pgTable(
  "mint_transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    streamId: text("stream_id").notNull().references(() => drops.streamId),
    collectionAddress: varchar("collection_address", { length: 42 }).notNull(),
    minter: varchar("minter", { length: 42 }).notNull(),
    recipient: varchar("recipient", { length: 42 }).notNull(),
    amount: text("amount").notNull(), // bigint as string
    currency: varchar("currency", { length: 10 }).notNull(), // "native" | "erc20"
    txHash: varchar("tx_hash", { length: 66 }).notNull().unique(),
    tokenId: text("token_id"), // set on success
    status: varchar("status", { length: 10 }).notNull().default("pending"), // pending | success | failed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    streamIdx: index("mints_stream_id_idx").on(table.streamId),
    minterIdx: index("mints_minter_idx").on(table.minter),
    txHashIdx: index("mints_tx_hash_idx").on(table.txHash),
    statusIdx: index("mints_status_idx").on(table.status),
  })
);
