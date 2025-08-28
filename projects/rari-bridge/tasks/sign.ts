import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getLedgerSigner } from "@rarible/deploy-utils";

task("ledger:sign", "Sign a message with a Ledger device")
  .addParam("message", "Message to sign. Use --hex true if passing raw hex bytes")
  .addOptionalParam("path", "Ledger derivation path", "m/44'/60'/0'/0/0")
  .addOptionalParam("hex", "Interpret message as hex bytes (0x...)", "false")
  .setAction(async (args: { message: string; path?: string; hex?: string }, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const derivationPath = args.path || "m/44'/60'/0'/0/0";
    const signer = getLedgerSigner(ethers.provider, derivationPath);
    const address = await signer.getAddress();

    const isHex = String(args.hex).toLowerCase() === "true";
    const payload = isHex ? ethers.utils.arrayify(args.message) : args.message;

    console.log("Ledger address:", address);
    console.log("Signing payload (hex=", isHex, ")...");

    const signature = await signer.signMessage(payload as any);
    const recovered = ethers.utils.verifyMessage(payload as any, signature);

    console.log("Signature:", signature);
    console.log("Recovered address:", recovered);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      console.warn("Warning: recovered address does not match Ledger address");
    }

    return signature;
  });
