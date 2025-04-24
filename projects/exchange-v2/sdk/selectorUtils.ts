import { ethers } from 'ethers';

/**
 * Return 4-byte selector for "V3"
 */
export function getV3Selector(): string {
  const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("V3"));
  return ethers.utils.hexDataSlice(hash, 0, 4);
}