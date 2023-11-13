import { ethers } from 'hardhat'
import fs from 'fs';
import * as path from 'path';

function getBytes4FromString(input: string): string {
  const hash: string = ethers.utils.id(input);
  return hash.substring(0, 10);
}

export const ERC721_LAZY = getBytes4FromString("ERC721_LAZY")
export const ERC1155_LAZY = getBytes4FromString("ERC1155_LAZY")
export const COLLECTION = getBytes4FromString("COLLECTION")

export function getConfig(network: string): any {
  const configPath: string = path.join(__dirname, "config", network + ".json");
  if (fs.existsSync(configPath)) {
    const config = require(configPath)
    return config;
  } else {
    throw new Error('No config for the network: ' + network);
  }
}
