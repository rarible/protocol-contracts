import { ObjectManager } from "@filebase/sdk";
import { randomUUID } from "crypto";

const objectManager = new ObjectManager(
  process.env.S3_KEY!,
  process.env.S3_SECRET!,
  {
    bucket: process.env.S3_BUCKET!,
  }
);

/**
 * Uploads metadata JSON to Filebase and returns the `ipfs://` URI.
 */
export async function uploadMetadataToIPFS(contract: string, metadata: object): Promise<string> {
  const content = Buffer.from(JSON.stringify(metadata));
  const filename = `${contract}/metadata/${randomUUID()}`;

  const uploaded = await objectManager.upload(filename, content);

  // Return a usable `ipfs://` URI
  return `ipfs://${uploaded.cid}`;
}

/**
 * Uploads allowlist JSON to Filebase and returns the `ipfs://` URI.
 */
export async function uploadAllowlistToIPFS(contract: string, allowlist: object): Promise<string> {
  const content = Buffer.from(JSON.stringify(allowlist));
  const filename = `${contract}/allowlist/${randomUUID()}.json`;

  const uploaded = await objectManager.upload(filename, content);

  // Return a usable `ipfs://` URI
  return `ipfs://${uploaded.cid}`;
}