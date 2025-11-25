import fs from 'fs';
import * as path from 'path';

// conflicting with zkSync ethers
/*
function getBytes4FromString(input: string): string {
  const hash: string = ethers.utils.id(input);
  return hash.substring(0, 10);
}

export const ERC721_LAZY = getBytes4FromString("ERC721_LAZY")
export const ERC1155_LAZY = getBytes4FromString("ERC1155_LAZY")
export const COLLECTION = getBytes4FromString("COLLECTION")
*/
export const ERC721_LAZY = "0xd8f960c1"
export const ERC1155_LAZY = "0x1cdfaa40"
export const COLLECTION = "0xf63c2825"

export function getConfig(network: string): any {
  const configPath: string = path.join(__dirname, "config", network + ".json");
  if (fs.existsSync(configPath)) {
    const config = require(configPath)
    return config;
  } else {
    throw new Error('No config for the network: ' + network);
  }
}

export const DEPLOY_FROM = process.env.DEPLOY_FROM;
export const ROYALTIES_REGISTRY_TYPE = process.env.ROYALTIES_REGISTRY_TYPE || "RoyaltiesRegistry";

export const DETERMENISTIC_DEPLOYMENT_SALT: string = process.env.DETERMENISTIC_DEPLOYMENT_SALT || "0x1118";

export const GAS_PRICE: string = process.env.GAS_PRICE || "1000000";