import { task } from "hardhat/config";
import { BytesLike } from "ethers";

task("revoke-role", "Revokes a role from an account on a compatible contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", `The role to revoke. Use:
    - "DEFAULT_ADMIN_ROLE" (0x00)
    - human-readable name like "MINTER_ROLE" (will be hashed)
    - or raw bytes32 hex string`)
  .addParam("to", "The address from which the role will be revoked")
  .addOptionalParam("from", "The address of the signer (defaults to the first available signer)")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const { revokeRole } = await import("../sdk");

    const contractAddress: string = args.contract;
    const account: string = args.to;

    // Resolve role into bytes32
    let role: BytesLike;
    if (
      args.role === "DEFAULT_ADMIN_ROLE" ||
      args.role === "default_admin" ||
      args.role === "admin" ||
      args.role === "0x00"
    ) {
      role = ethers.constants.HashZero;
    } else if (args.role.startsWith("0x") && args.role.length === 66) {
      role = args.role;
    } else {
      role = ethers.utils.id(args.role);
    }

    // Resolve signer
    let signer;
    if (args.from) {
      signer = await ethers.getSigner(args.from);
    } else {
      [signer] = await ethers.getSigners();
    }

    const signerAddress = await signer.getAddress();
    console.log(`Revoking role ${role} from ${account} on ${contractAddress} using ${signerAddress}`);

    await revokeRole(contractAddress, role, account, signer);
    console.log(`✅ Role ${role} revoked from ${account} on ${contractAddress}`);
  });
