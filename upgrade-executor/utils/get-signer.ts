import { TrezorSigner } from "@nxqbao/eth-signer-trezor";
import { Signer } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";
import { LedgerSigner } from "@anders-t/ethers-ledger";

const dotenvConfigPath: string = "../../.env";
dotenvConfig({ path: resolve(__dirname, dotenvConfigPath) });

export async function getSigner(hre: HardhatRuntimeEnvironment): Promise<Signer> {

    const account =  process.env[`HW_ACCOUNT_${hre.network.name.toUpperCase()}`]
    if(account) {
        console.log("Hardware signer found: ",account)
        if(account.includes("trezor")) {
            return new TrezorSigner(hre.ethers.provider, account)
        }

        if(account.includes("ledger")) {
            return new LedgerSigner(hre.ethers.provider, account)
        }
        
    }
    console.log("No hardware signer was found: ", account)

    const signers = await hre.ethers.getSigners();
    const signer = signers[0]; // Using the first signer by default
    console.log("Default signer found: ", signer.address)
    return signer
}