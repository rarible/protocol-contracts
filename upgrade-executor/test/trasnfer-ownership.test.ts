import { ethers, network } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { transferOwnership } from "../tasks/transfer-ownership";
import { loadContractsTransferSettings } from "../utils/config";

import { IContractsTransfer } from "../utils/config";

import { RariGovernorABI } from "./abis/RariGovernor"

describe("Transfer Ownership", function () {
  let upgradeExecutor: any;
  let signers: SignerWithAddress[];
  let newOwner: SignerWithAddress;
  let testHelper: any;

  const proxyAdminProtocolOwner = "0x20b9049c69DeA7e5d46De82cE0b33A9D5a8a0893";
  let proxyAdminProtocolOwnerSigner: SignerWithAddress;

  before(async () => {
    [newOwner, ...signers] = await ethers.getSigners();

    proxyAdminProtocolOwnerSigner = await ethers.getImpersonatedSigner(proxyAdminProtocolOwner);

    //deploy testHelper
    const TestHelper = await ethers.getContractFactory('TestHelper');
    testHelper = await TestHelper.deploy()
  });

  it("should be able to transfer ownership to UpgradeExecutor and back using proposals", async function () {
    const user = "0x1d671d1B191323A38490972D58354971E5c1cd2A"
    const userSigner = await ethers.getImpersonatedSigner(user)

    // get settings
    const settingsGovernance = await loadContractsTransferSettings("utils/config/governance-contracts.yaml");
    const settingsLocking = await loadContractsTransferSettings("utils/config/locking-contracts.yaml");
    const settingsProtocol = await loadContractsTransferSettings("utils/config/protocol-contracts.yaml");
    const settingsAdminProxies = await loadContractsTransferSettings("utils/config/admin-proxies.yaml");

    //deploy upgradeExecutor
    const UpgradeExecutor = await ethers.getContractFactory('UpgradeExecutor');
    upgradeExecutor = await UpgradeExecutor.deploy();
    //initialize upgradeExecutor
    await upgradeExecutor.initialize(upgradeExecutor.address, [settingsGovernance.accessControl.RariTimelockController]);

    //deploy OwnershipTransferAction
    const OwnershipTransferAction = await ethers.getContractFactory('OwnershipTransferAction')
    const ownershipTransferAction = await OwnershipTransferAction.deploy();

    //deploy OwnershipTransferAction
    const TimelockAdminshipTransferAndRenounceAction = await ethers.getContractFactory('TimelockAdminshipTransferAndRenounceAction')
    const timelockAdminshipTransferAndRenounceAction = await TimelockAdminshipTransferAndRenounceAction.deploy();

    //transfer ownerships
    //governance
    await transferOwnership(settingsGovernance, upgradeExecutor.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settingsGovernance, upgradeExecutor.address)

    //locking
    await transferOwnership(settingsLocking, upgradeExecutor.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settingsLocking, upgradeExecutor.address)

    //protocol
    await transferOwnership(settingsProtocol, upgradeExecutor.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settingsProtocol, upgradeExecutor.address)

    //admin proxies
    await transferOwnership(settingsAdminProxies, upgradeExecutor.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settingsAdminProxies, upgradeExecutor.address)

    //prepare data for proposal
    const governor = new ethers.Contract("0x6552C8fb228f7776Fc0e4056AA217c139D4baDa1", RariGovernorABI, userSigner)

    const ownableContracts = [
      "0xDc8BaA86f136F8B0851F090a4DfFDc7b5F46688D", //admin1
      "0x80033c932904E077e55a6E43E5E9a796f34d2525", //admin2
      "0x096Bd9a7a2e703670088C05035e23c7a9F428496", //Locking
      "0xc633F65A1BEBD433DF12D9F3ac7aCF31b26Ca1E6", //RariMineV3
      "0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF", //RariToken
      "0xEa90CFad1b8e030B8Fd3E63D22074E0AEb8E0DCD", //RoyaltiesRegistry
      "0x9757F2d2b135150BBeb65308D4a91804107cd8D6", //ExchangeV2
      "0x75a8B7c0B22D973E0B46CfBD3e2f6566905AA79f", //ERC1155LazyMintTransferProxy
      "0xb8e4526e0da700e9ef1f879af713d691f81507d8", //ERC20TransferProxy
      "0xbb7829BFdD4b557EB944349b2E2c965446052497", //ERC721LazyMintTransferProxy
      "0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be", //TransferProxy
    ]

    const accessContolContracts = [
      "0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5" //RariTimelockController
    ]

    const [actionCallDatas, arrayOfValues, arrayOfUpgradeExecutorAddresses] = await prepareOwnershipData(ownableContracts, accessContolContracts, proxyAdminProtocolOwner, ownershipTransferAction.address, timelockAdminshipTransferAndRenounceAction.address)

    const discr = "Proposal #1: Give grant to team";

    //create proposals to give ownerships back
    const proposalTx = await governor['propose(address[],uint256[],bytes[],string)'](
      arrayOfUpgradeExecutorAddresses,
      arrayOfValues,
      actionCallDatas,
      discr
    )

    const proposalReceipt = await proposalTx.wait()

    const proposalId = proposalReceipt.events[0].args.proposalId;

    const VoteType = {
      Against: 0,
      For: 1,
      Abstain: 2
    }

    //vote for proposal
    const voteTx = await governor.castVote(proposalId, VoteType.For)

    const voteReceipt = await voteTx.wait(37000)

    const hashDiscr = await testHelper.hashDescription(discr)

    //queue proposal
    const queueTx = await governor['queue(address[],uint256[],bytes[],bytes32)'](
      arrayOfUpgradeExecutorAddresses,
      arrayOfValues,
      actionCallDatas,
      hashDiscr
    )

    const queueReceipt = await queueTx.wait()

    //move time
    await network.provider.send("evm_increaseTime", [360000])
    await network.provider.send("evm_mine")

    //execute proposal
    const executeTx = await governor['execute(address[],uint256[],bytes[],bytes32)'](
      arrayOfUpgradeExecutorAddresses,
      arrayOfValues,
      actionCallDatas,
      hashDiscr
    )

    const executeReceipt = await executeTx.wait()

    //check owners
    await chekOwner(settingsGovernance, proxyAdminProtocolOwner)
    await chekOwner(settingsLocking, proxyAdminProtocolOwner)
    await chekOwner(settingsProtocol, proxyAdminProtocolOwner)
    await chekOwner(settingsAdminProxies, proxyAdminProtocolOwner)
  });

  it("should be able to transfer ownership for protocol contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/protocol-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settings, newOwner.address)
  });

  it("should be able to transfer ownership back for protocol contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/protocol-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
    await chekOwner(settings, proxyAdminProtocolOwnerSigner.address)
  });

  it("should be able to transfer ownership for locking contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/locking-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settings, newOwner.address)
  });

  it("should be able to transfer ownership back for locking contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/locking-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
    await chekOwner(settings, proxyAdminProtocolOwnerSigner.address)
  });

  it("should be able to transfer ownership for governance contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/governance-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settings, newOwner.address)
  });

  it("should be able to transfer ownership back for governance contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/governance-contracts.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
    await chekOwner(settings, proxyAdminProtocolOwnerSigner.address)
  });

  it("should be able to transfer ownership for adminProxy contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/admin-proxies.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, newOwner.address, proxyAdminProtocolOwnerSigner)
    await chekOwner(settings, newOwner.address)
  });

  it("should be able to transfer ownership back for adminProxy contracts", async function () {
    const settings = await loadContractsTransferSettings("utils/config/admin-proxies.yaml"); // Load settings from the YAML file or define them here
    await transferOwnership(settings, proxyAdminProtocolOwnerSigner.address, newOwner)
    await chekOwner(settings, proxyAdminProtocolOwnerSigner.address)
  });


  async function chekOwner(
    settings: IContractsTransfer,
    owner: string
  ) {

    // Transfer ownership of each contract in contracts
    for (const [key, address] of Object.entries(settings.ownable)) {
      console.log(`Checking owner for ${key}`);
      const contract = await ethers.getContractAt('Ownable', address)
      const _newOwner = await contract.owner()
      expect(_newOwner).to.equal(owner);
    }

    // Transfer ownership of each access contract
    for (const [key, address] of Object.entries(settings.accessControl)) {
      console.log(`Checking admin role for ${key}`);
      const contract = await ethers.getContractAt('AccessControlUpgradeable', address)
      const TIMELOCK_ADMIN_ROLE = ethers.utils.id("TIMELOCK_ADMIN_ROLE");
      const hasRole = await contract.hasRole(TIMELOCK_ADMIN_ROLE, owner)
      expect(hasRole).to.equal(true);
    }
    console.log()
  }

  async function prepareOwnershipData(contractAddresses: string[], accessContolContracts: string[], _newOwner: string, actionOwnerAddress: string, actionAdminAddress: string) {
    let actionCalldatas: string[] = [];
    let arrayOfUpgradeExecutorAddresses: string[] = [];
    let arrayOfValues: number[] = [];

    for (const contractAddress of contractAddresses) {
      const ownershipTransferData = await testHelper.encodeOwnershipTransferCall(contractAddress, _newOwner)
      const actionCallData = await testHelper.encodeUpgradeActionCall(actionOwnerAddress, ownershipTransferData)
      actionCalldatas.push(actionCallData)
      arrayOfUpgradeExecutorAddresses.push(upgradeExecutor.address)
      arrayOfValues.push(0);
    }

    for (const contractAddress of accessContolContracts) {
      const ownershipTransferData = await testHelper.encodeAdminshipTimelockCall(contractAddress, _newOwner)
      const actionCallData = await testHelper.encodeUpgradeActionCall(actionAdminAddress, ownershipTransferData)
      actionCalldatas.push(actionCallData)
      arrayOfUpgradeExecutorAddresses.push(upgradeExecutor.address)
      arrayOfValues.push(0);
    }

    return [actionCalldatas, arrayOfValues, arrayOfUpgradeExecutorAddresses];
  }
});