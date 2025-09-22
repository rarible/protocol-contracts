import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { LedgerSigner } from "@anders-t/ethers-ledger";
const { HARDWARE_DERIVATION } = process.env;
import { ethers } from 'ethers';

export async function getSigner(hre: HardhatRuntimeEnvironment): Promise<ethers.Signer>{
  const { getSigner } = hre.deployments;
  const { deployer } = await hre.getNamedAccounts();
  if (!HARDWARE_DERIVATION) {
    const signer = await getSigner(deployer);
    return signer;
  } else {
    const path = HARDWARE_DERIVATION.split(":")[1].replace("//", "");
    console.log("HARDWARE_DERIVATION", HARDWARE_DERIVATION);
    console.log("HARDWARE_DERIVATION", path);

    const signer = new LedgerSigner(hre.ethers.provider, "m/44'/60'/0'/0/0");
    return signer;
  }
}