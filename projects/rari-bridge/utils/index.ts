export const DETERMENISTIC_DEPLOYMENT_SALT: string = process.env.DETERMENISTIC_DEPLOYMENT_SALT || "0x1118";

// ethers v5
import { utils } from "ethers";

/**
 * Left-pads an Ethereum address to 32 bytes, matching:
 * bytes32(uint256(uint160(_addr)))
 */
export function addressToBytes32(addr: string): string {
  const checksum = utils.getAddress(addr);        // validate + checksum
  return utils.hexZeroPad(checksum, 32);          // left-pad to 32 bytes
}