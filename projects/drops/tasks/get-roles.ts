import { task } from "hardhat/config";

// getRoleAdmin
task("getRoleAdmin", "Get the admin role of a given role from a Permissions contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", "The role to query (in bytes32 string format)")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getRoleAdmin } = await import("../sdk");

    try {
      const admin = await getRoleAdmin(args.contract, args.role, signer);
      console.log(`Admin of role ${args.role}: ${admin}`);
    } catch (error) {
      console.error("Error fetching role admin:", error);
    }
  });

// getRoleMember
task("getRoleMember", "Get the address of a role member by index from a PermissionsEnumerable contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", "The role to query (in bytes32 string format)")
  .addParam("index", "Index of the role member to fetch")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getRoleMember } = await import("../sdk");

    try {
      const member = await getRoleMember(args.contract, args.role, parseInt(args.index), signer);
      console.log(`Role member at index ${args.index} for role ${args.role}: ${member}`);
    } catch (error) {
      console.error("Error fetching role member:", error);
    }
  });

// getRoleMemberCount
task("getRoleMemberCount", "Get the number of members for a given role from a PermissionsEnumerable contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", "The role to query (in bytes32 string format)")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { getRoleMemberCount } = await import("../sdk");

    try {
      const count = await getRoleMemberCount(args.contract, args.role, signer);
      console.log(`Number of members for role ${args.role}: ${count.toString()}`);
    } catch (error) {
      console.error("Error fetching role member count:", error);
    }
  });

// hasRole
task("hasRole", "Check if an account has a specific role in a Permissions contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", "The role to check (in bytes32 string format)")
  .addParam("account", "The account to check")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { hasRole } = await import("../sdk");

    try {
      const result = await hasRole(args.contract, args.role, args.account, signer);
      console.log(`Account ${args.account} ${result ? "has" : "does not have"} role ${args.role}`);
    } catch (error) {
      console.error("Error checking role:", error);
    }
  });

// hasRoleWithSwitch
task("hasRoleWithSwitch", "Check if an account has a specific role (with role switch logic) in a Permissions contract")
  .addParam("contract", "The deployed contract address")
  .addParam("role", "The role to check (in bytes32 string format)")
  .addParam("account", "The account to check")
  .addOptionalParam("from", "Address to sign the transaction")
  .setAction(async (args, hre) => {
    const { ethers } = hre;
    const signer = args.from
      ? await ethers.getSigner(args.from)
      : (await ethers.getSigners())[0];

    const { hasRoleWithSwitch } = await import("../sdk");

    try {
      const result = await hasRoleWithSwitch(args.contract, args.role, args.account, signer);
      console.log(`Account ${args.account} ${result ? "has" : "does not have"} role ${args.role} (with switch)`);
    } catch (error) {
      console.error("Error checking role with switch:", error);
    }
  });
