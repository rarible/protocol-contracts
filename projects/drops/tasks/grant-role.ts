import { task } from "hardhat/config";
import { BytesLike } from "ethers";

task("grant-role", "Grants a role to an account on a compatible contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", `The role to grant. Use:
    - "DEFAULT_ADMIN_ROLE" (0x00)
    - human-readable name like "MINTER_ROLE" (will be hashed)
    - or raw bytes32 hex string`)
  .addParam("to", "The address to grant the role to")
  .addOptionalParam("from", "The address of the signer (defaults to first signer)")
  .addOptionalParam("contractType", 'Contract type: "721" | "1155" | "oe"')
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { grantRole } = await import("../sdk");

    const contractAddress: string = args.contract;
    const account: string = args.to;

    // Resolve role into bytes32
    let role: BytesLike;
    if (
      args.role === "DEFAULT_ADMIN_ROLE" ||
      args.role === "default_admin" || // alias for convenience
      args.role === "admin" ||
      args.role === "0x00"
    ) {
      role = ethers.constants.HashZero; // = 0x000...00
    } else if (args.role.startsWith("0x") && args.role.length === 66) {
      role = args.role;
    } else {
      role = ethers.utils.id(args.role);
    }

    // Get signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    console.log(`Granting role ${role} to ${account} on ${contractAddress} using ${await signer.getAddress()}`);

    await grantRole(contractAddress, role, account, signer, args.contractType);
    console.log(`✅ Role ${role} granted to ${account} on ${contractAddress}`);
  });
