import { TrezorSigner } from "@nxqbao/eth-signer-trezor";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const dotenvConfigPath: string = "../../.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

export async function getSigner(hre: HardhatRuntimeEnvironment): Promise<SignerWithAddress> {
  const network = hre.network.name;
  let signer;
  if (network === "hardhat") {
    signer = await hre.ethers.getImpersonatedSigner("0x20b9049c69DeA7e5d46De82cE0b33A9D5a8a0893");
  }  else {
    const signers = await hre.ethers.getSigners();
    signer = signers[0]; // Using the first signer by default
  }
  
  return signer
}