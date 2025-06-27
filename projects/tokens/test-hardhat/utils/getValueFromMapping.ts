import { ethers } from "hardhat";

export const getValueFromMapping = async (contract: any, target: string, targetType: string, slot: number) => {
    const encodedKey = ethers.utils.defaultAbiCoder.encode([targetType], [target]);
    const paddedSlot = ethers.utils.hexZeroPad(ethers.utils.hexlify(slot), 32);
    const concatenated = ethers.utils.concat([encodedKey, paddedSlot]);
    const storageSlot = ethers.utils.keccak256(concatenated);
    const raw = await ethers.provider.getStorageAt(contract.address, storageSlot);
    return raw;
  }