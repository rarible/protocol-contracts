import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { UpgradeExecutor } from "../typechain-types";
import {transferOwnership} from "../tasks/transfer-ownership";
import { loadContractsTransferSettings } from "../utils/config";

describe("Transfer Ownership", function () {
  let upgradeExecutor: UpgradeExecutor;
  let signers: SignerWithAddress[];
  let newOwner: SignerWithAddress;
  const proxyAdminProtocolOwner = "0x20b9049c69DeA7e5d46De82cE0b33A9D5a8a0893";
  let proxyAdminProtocolOwnerSigner: SignerWithAddress;

  before(async () => {
    [newOwner, ...signers] = await ethers.getSigners();
    
    //deploy upgradeExecutor
    const UpgradeExecutor = await ethers.getContractFactory('UpgradeExecutor');
    upgradeExecutor = await UpgradeExecutor.deploy() as UpgradeExecutor

    //initialize upgradeExecutor
    await upgradeExecutor.initialize(signers[0].address, [signers[0].address]);

    proxyAdminProtocolOwnerSigner = await ethers.getImpersonatedSigner(proxyAdminProtocolOwner);
    
  });

  it("should be able to transfer ownership for protocol contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/protocol-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
  });

  it("should be able to transfer ownership back for protocol contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/protocol-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership for locking contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/locking-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
  });

  it("should be able to transfer ownership back for locking contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/locking-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership for governance contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/governance-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
  });

  it("should be able to transfer ownership back for governance contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/governance-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
  });
});