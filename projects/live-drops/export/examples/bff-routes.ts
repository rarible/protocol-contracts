/**
 * EXAMPLE: Hono API routes for LiveDrops in BFF
 * Adapt to your existing route structure.
 */
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
// import { db } from "../db";
// import { drops, mintTransactions } from "../schema";
// import { eq } from "drizzle-orm";

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

const reportDropSchema = z.object({
  streamId: z.string().min(1),
  collectionAddress: addressSchema,
  creator: addressSchema,
  name: z.string().min(1),
  symbol: z.string().min(1),
  txHash: txHashSchema,
});

const reportMintSchema = z.object({
  streamId: z.string().min(1),
  collectionAddress: addressSchema,
  minter: addressSchema,
  recipient: addressSchema,
  amount: z.string().min(1),
  currency: z.enum(["native", "erc20"]),
  txHash: txHashSchema,
});

const updateMintStatusSchema = z.object({
  txHash: txHashSchema,
  status: z.enum(["success", "failed"]),
  tokenId: z.string().optional(),
});

export const liveDropsRoutes = new Hono()

  /**
   * POST /api/drops — FE reports a drop was created
   */
  .post("/", zValidator("json", reportDropSchema), async (c) => {
    const body = c.req.valid("json");

    // await db.insert(drops).values(body);

    return c.json({ ok: true, collectionAddress: body.collectionAddress });
  })

  /**
   * GET /api/drops/:streamId — Get drop info by stream ID
   */
  .get("/:streamId", async (c) => {
    const streamId = c.req.param("streamId");

    // const drop = await db.query.drops.findFirst({
    //   where: eq(drops.streamId, streamId),
    // });

    // if (!drop) return c.json({ error: "Drop not found" }, 404);
    // return c.json(drop);

    return c.json({ streamId });
  })

  /**
   * POST /api/drops/:streamId/mints — FE reports a mint was initiated
   */
  .post("/:streamId/mints", zValidator("json", reportMintSchema), async (c) => {
    const body = c.req.valid("json");

    // await db.insert(mintTransactions).values(body);

    return c.json({ ok: true, txHash: body.txHash });
  })

  /**
   * PATCH /api/drops/mints/status — FE updates mint tx status
   */
  .patch("/mints/status", zValidator("json", updateMintStatusSchema), async (c) => {
    const body = c.req.valid("json");

    // await db
    //   .update(mintTransactions)
    //   .set({ status: body.status, tokenId: body.tokenId, updatedAt: new Date() })
    //   .where(eq(mintTransactions.txHash, body.txHash));

    return c.json({ ok: true });
  });
