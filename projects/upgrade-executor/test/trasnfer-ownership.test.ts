import { ethers, network, deployments } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { transferSingleContractOwnership, transferTimelockAdminRole, renounceTimelockAdminRole} from "../tasks/transfer-ownership";
import { getContractsAddressesToMigrate } from "../utils/config";

import { RariGovernorABI } from "./abis/RariGovernor"

describe("Transfer Ownership", function () {
  let upgradeExecutorAddress: string;
  let signers: SignerWithAddress[];
  let newOwner: SignerWithAddress;
  let testHelper: any;

  const proxyAdminProtocolOwner = "0x20b9049c69DeA7e5d46De82cE0b33A9D5a8a0893";
  let proxyAdminProtocolOwnerSigner: SignerWithAddress;

  let settings: any;

  enum ProposalState {
    Pending,
    Active,
    Canceled,
    Defeated,
    Succeeded,
    Queued,
    Expired,
    Executed
  }

  before(async () => {
    [newOwner, ...signers] = await ethers.getSigners();

    proxyAdminProtocolOwnerSigner = await ethers.getImpersonatedSigner(proxyAdminProtocolOwner);

    //deploy testHelper
    const TestHelper = await ethers.getContractFactory('TestHelper');
    testHelper = await TestHelper.deploy()

    //get settings
    settings = await getContractsAddressesToMigrate();
    /*
    {
      Locking: '0x096Bd9a7a2e703670088C05035e23c7a9F428496',
      RariMineV3: '0xc633F65A1BEBD433DF12D9F3ac7aCF31b26Ca1E6',
      RariToken: '0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF',
      AdminProxyGovernance: '0xDc8BaA86f136F8B0851F090a4DfFDc7b5F46688D',
      AdminProxyLockingProtocol: '0x80033c932904E077e55a6E43E5E9a796f34d2525',
      RariTimelockController: '0x7e9c956e3EFA81Ace71905Ff0dAEf1A71f42CBC5',
      RoyaltiesRegistry: '0xEa90CFad1b8e030B8Fd3E63D22074E0AEb8E0DCD',
      ExchangeV2: '0x9757F2d2b135150BBeb65308D4a91804107cd8D6',
      ERC1155LazyMintTransferProxy: '0x75a8B7c0B22D973E0B46CfBD3e2f6566905AA79f',
      ERC20TransferProxy: '0xb8e4526e0da700e9ef1f879af713d691f81507d8',
      ERC721LazyMintTransferProxy: '0xbb7829BFdD4b557EB944349b2E2c965446052497',
      TransferProxy: '0x4fee7b061c97c9c496b01dbce9cdb10c02f0a0be'
    }
    */
  });

  //timelock, access control
  it("should be able to transfer and renounce adminship of RariTimelockController contract", async function () {
    await transferTimelockAdminRole(settings.RariTimelockController, newOwner.address, proxyAdminProtocolOwnerSigner)
    await renounceTimelockAdminRole(settings.RariTimelockController, proxyAdminProtocolOwnerSigner.address, proxyAdminProtocolOwnerSigner)

    await transferTimelockAdminRole(settings.RariTimelockController, proxyAdminProtocolOwnerSigner.address, newOwner)
    await renounceTimelockAdminRole(settings.RariTimelockController, newOwner.address, newOwner)
  });

  //ownable
  it("should be able to transfer ownership of Locking contract", async function () {
    await transferSingleContractOwnership(settings.Locking, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.Locking, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of RariMineV3 contract", async function () {
    await transferSingleContractOwnership(settings.RariMineV3, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.RariMineV3, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of RariToken contract", async function () {
    await transferSingleContractOwnership(settings.RariToken, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.RariToken, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of AdminProxyGovernance contract", async function () {
    await transferSingleContractOwnership(settings.AdminProxyGovernance, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.AdminProxyGovernance, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of AdminProxyLockingProtocol contract", async function () {
    await transferSingleContractOwnership(settings.AdminProxyLockingProtocol, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.AdminProxyLockingProtocol, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of RoyaltiesRegistry contract", async function () {
    await transferSingleContractOwnership(settings.RoyaltiesRegistry, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.RoyaltiesRegistry, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of ExchangeV2 contract", async function () {
    await transferSingleContractOwnership(settings.ExchangeV2, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.ExchangeV2, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of ERC1155LazyMintTransferProxy contract", async function () {
    await transferSingleContractOwnership(settings.ERC1155LazyMintTransferProxy, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.ERC1155LazyMintTransferProxy, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of ERC20TransferProxy contract", async function () {
    await transferSingleContractOwnership(settings.ERC20TransferProxy, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.ERC20TransferProxy, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of ERC721LazyMintTransferProxy contract", async function () {
    await transferSingleContractOwnership(settings.ERC721LazyMintTransferProxy, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.ERC721LazyMintTransferProxy, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  it("should be able to transfer ownership of TransferProxy contract", async function () {
    await transferSingleContractOwnership(settings.TransferProxy, newOwner.address, proxyAdminProtocolOwnerSigner)
    await transferSingleContractOwnership(settings.TransferProxy, proxyAdminProtocolOwnerSigner.address, newOwner)
  });

  //full test with upgrade executor
  it("should be able to transfer ownership to UpgradeExecutor and back using proposals, full test with migrations", async function () {
    const user = "0x1d671d1B191323A38490972D58354971E5c1cd2A"
    const userSigner = await ethers.getImpersonatedSigner(user)

    //deploy OwnershipTransferAction
    const OwnershipTransferAction = await ethers.getContractFactory('OwnershipTransferAction')
    const ownershipTransferAction = await OwnershipTransferAction.deploy();

    //deploy OwnershipTransferAction
    const TimelockAdminshipTransferAndRenounceAction = await ethers.getContractFactory('TimelockAdminshipTransferAndRenounceAction')
    const timelockAdminshipTransferAndRenounceAction = await TimelockAdminshipTransferAndRenounceAction.deploy();

    //transfer ownerships

    //execute all migrations: deploy upgradeExecutor, ownership transfer and renouncement
    const {UpgradeExecutor} = await deployments.fixture(['executor', 'ownership-transfer', 'ownership-renouncement', 'RoyaltiesRegistry'])
    upgradeExecutorAddress = UpgradeExecutor.address;

    //check owners
    await checkOwner(settings.Locking, upgradeExecutorAddress)
    await checkOwner(settings.RariMineV3, upgradeExecutorAddress)
    await checkOwner(settings.RariToken, upgradeExecutorAddress)
    await checkOwner(settings.AdminProxyGovernance, upgradeExecutorAddress)
    await checkOwner(settings.AdminProxyLockingProtocol, upgradeExecutorAddress)
    await checkOwner(settings.RoyaltiesRegistry, upgradeExecutorAddress)
    await checkOwner(settings.ExchangeV2, upgradeExecutorAddress)
    await checkOwner(settings.ERC1155LazyMintTransferProxy, upgradeExecutorAddress)
    await checkOwner(settings.ERC20TransferProxy, upgradeExecutorAddress)
    await checkOwner(settings.ERC721LazyMintTransferProxy, upgradeExecutorAddress)
    await checkOwner(settings.TransferProxy, upgradeExecutorAddress)

    //check admin
    await checkAdmin(settings.RariTimelockController, upgradeExecutorAddress, proxyAdminProtocolOwner)

    //prepare data for proposal
    const governor = new ethers.Contract("0x6552C8fb228f7776Fc0e4056AA217c139D4baDa1", RariGovernorABI, userSigner)

    const votingPeriod = await governor.votingPeriod();
    console.log(`Voting Period: ${votingPeriod}`);

    const votingDelay = await governor.votingDelay();
    console.log(`Voting Delay: ${votingDelay}`);

    const proposalThreshold = await governor.proposalThreshold();
    console.log(`Proposal Threshold: ${proposalThreshold}`);
  
    const votingPower = await governor.getVotes(user, await ethers.provider.getBlockNumber() - 1);
    console.log(`Voting Power: ${votingPower}`);
    expect(votingPower).to.be.gte(proposalThreshold);

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

    const initialProposalState = await governor.state(proposalId);
    console.log(`Proposal ${proposalId} State: ${initialProposalState}`);
    expect(initialProposalState).to.be.eq(ProposalState.Active); 

    const VoteType = {
      Against: 0,
      For: 1,
      Abstain: 2
    }

    //vote for proposal
    const voteTx = await governor.castVote(proposalId, VoteType.For)

    const voteReceipt = await voteTx.wait()

    const hashDiscr = await testHelper.hashDescription(discr)

    const proposalDeadline = await governor.proposalDeadline(proposalId);
    console.log(`Proposal ${proposalId} Deadline: ${proposalDeadline}`);

    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`Current Block: ${currentBlock}`);

    /* Advance Voting Periods time, measured on blocks */
    await network.provider.send("hardhat_mine", ['0x'+ ((36000).toString(16))]); 

    const currentBlockAfter = await ethers.provider.getBlockNumber();
    console.log(`Current Block After: ${currentBlockAfter}`);
    expect(currentBlockAfter).to.be.gt(proposalDeadline);

    const proposalState = await governor.state(proposalId);
    console.log(`Proposal ${proposalId} State: ${proposalState}`);
    expect(proposalState).to.be.eq(ProposalState.Succeeded); 

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
    await checkOwner(settings.Locking, proxyAdminProtocolOwner)
    await checkOwner(settings.RariMineV3, proxyAdminProtocolOwner)
    await checkOwner(settings.RariToken, proxyAdminProtocolOwner)
    await checkOwner(settings.AdminProxyGovernance, proxyAdminProtocolOwner)
    await checkOwner(settings.AdminProxyLockingProtocol, proxyAdminProtocolOwner)
    await checkOwner(settings.RoyaltiesRegistry, proxyAdminProtocolOwner)
    await checkOwner(settings.ExchangeV2, proxyAdminProtocolOwner)
    await checkOwner(settings.ERC1155LazyMintTransferProxy, proxyAdminProtocolOwner)
    await checkOwner(settings.ERC20TransferProxy, proxyAdminProtocolOwner)
    await checkOwner(settings.ERC721LazyMintTransferProxy, proxyAdminProtocolOwner)
    await checkOwner(settings.TransferProxy, proxyAdminProtocolOwner)

    //check admin
    await checkAdmin(settings.RariTimelockController, proxyAdminProtocolOwner, upgradeExecutorAddress)

  });

  async function checkOwner(
    contractAddress: string,
    owner: string
  ) {
    const contract = await ethers.getContractAt('Ownable', contractAddress)
    const _newOwner = await contract.owner()
    expect(_newOwner).to.equal(owner);
  }

  async function checkAdmin(
    contractAddress: string,
    admin: string,
    oldAdmin: string
  ) {
    const contract = await ethers.getContractAt('AccessControlUpgradeable', contractAddress)
    const TIMELOCK_ADMIN_ROLE = ethers.utils.id("TIMELOCK_ADMIN_ROLE");

    //admin is admin
    expect(await contract.hasRole(TIMELOCK_ADMIN_ROLE, admin)).to.equal(true);

    //oldAdmin is not admin
    expect(await contract.hasRole(TIMELOCK_ADMIN_ROLE, oldAdmin)).to.equal(false);
  }

  async function prepareOwnershipData(contractAddresses: string[], accessContolContracts: string[], _newOwner: string, actionOwnerAddress: string, actionAdminAddress: string) {
    let actionCalldatas: string[] = [];
    let arrayOfUpgradeExecutorAddresses: string[] = [];
    let arrayOfValues: number[] = [];

    for (const contractAddress of contractAddresses) {
      const ownershipTransferData = await testHelper.encodeOwnershipTransferCall(contractAddress, _newOwner)
      const actionCallData = await testHelper.encodeUpgradeActionCall(actionOwnerAddress, ownershipTransferData)
      actionCalldatas.push(actionCallData)
      arrayOfUpgradeExecutorAddresses.push(upgradeExecutorAddress)
      arrayOfValues.push(0);
    }

    for (const contractAddress of accessContolContracts) {
      const ownershipTransferData = await testHelper.encodeAdminshipTimelockCall(contractAddress, _newOwner)
      const actionCallData = await testHelper.encodeUpgradeActionCall(actionAdminAddress, ownershipTransferData)
      actionCalldatas.push(actionCallData)
      arrayOfUpgradeExecutorAddresses.push(upgradeExecutorAddress)
      arrayOfValues.push(0);
    }

    return [actionCalldatas, arrayOfValues, arrayOfUpgradeExecutorAddresses];
  }
});