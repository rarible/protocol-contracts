import { expect } from "chai";
import { ethers } from "hardhat";
import { network } from "hardhat";

import { Contract, Signer } from "ethers";
import path from "path";

function PurchaseData(marketId: number, amount: number, fees: number, data: string) {
  return { marketId, amount, fees, data };
}

describe("RaribleExchangeWrapper single purchase cases", function () {
  let bulkExchange: Contract;
  let exchangeV2: Contract;
  let wrapperHelper: Contract;
  let transferProxy: Contract;
  let royaltiesRegistry: Contract;
  let erc20TransferProxy: Contract;
  let erc721: Contract;
  let erc1155: Contract;

  let helper: Contract;
  let erc20: Contract;
  let protocol: string;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";
  const feeMethodsSidesKindsHowToCallsMask = [1, 0, 0, 1, 1, 1, 0, 1];
  const tokenId = 12345;
  let accounts: Signer[];
  let seller: Signer;
  let zoneAddr: Signer;

  before(async () => {
    accounts = await ethers.getSigners();
    protocol = await accounts[9].getAddress();
    seller = accounts[1];
    zoneAddr = accounts[2];

    helper = await (await ethers.getContractFactory("RaribleTestHelper")).deploy();
    wrapperHelper = await (await ethers.getContractFactory("WrapperHelper")).deploy();

    transferProxy = await (await ethers.getContractFactory("TransferProxy")).deploy();
    await transferProxy.__OperatorRole_init();

    erc20TransferProxy = await (await ethers.getContractFactory("ERC20TransferProxy")).deploy();
    await erc20TransferProxy.__OperatorRole_init();

    royaltiesRegistry = await (await ethers.getContractFactory("RoyaltiesRegistry")).deploy();
    await royaltiesRegistry.__RoyaltiesRegistry_init();
  });

  beforeEach(async () => {
    erc721 = await (await ethers.getContractFactory("TestERC721")).deploy("Rarible", "RARI");
    erc1155 = await (await ethers.getContractFactory("TestERC1155")).deploy();
  });

  describe("OpenSea 1.5 Integration", () => {
    it("should handle OpenSea orders correctly", async () => {
      // Load OpenSea contract artifacts
      const ConduitControllerArtifact = require(path.join(__dirname, '../build/contracts/ConduitController.json'));
      const conduitController = await (await ethers.getContractFactory(ConduitControllerArtifact.abi, ConduitControllerArtifact.bytecode)).deploy();
      const SeaportArtifact = require(path.join(__dirname, '../build/contracts/Seaport.json'));
      const seaport = await (await ethers.getContractFactory(SeaportArtifact.abi, SeaportArtifact.bytecode)).deploy(conduitController.address);

      // Deploy the wrapper contract
      bulkExchange = await (await ethers.getContractFactory("RaribleExchangeWrapper")).deploy(
        [ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, ZERO_ADDRESS, ZERO_ADDRESS, seaport.address, seaport.address],
        ZERO_ADDRESS,
        [],
        await accounts[0].getAddress()
      );

      // Create seaport order
      const buyerLocal1 = accounts[2];
      await erc721.connect(seller).mint(seller.getAddress(), tokenId);
      await erc721.connect(seller).setApprovalForAll(seaport.address, true);

      const considerationItemLeft = {
        itemType: 0,
        token: ZERO_ADDRESS,
        identifierOrCriteria: 0,
        startAmount: 100,
        endAmount: 100,
        recipient: await seller.getAddress()
      };

      const offerItemLeft = {
        itemType: 2, // 2: ERC721 items
        token: erc721.address,
        identifierOrCriteria: '0x3039',
        startAmount: 1,
        endAmount: 1
      };

      const OrderParametersLeft = {
        offerer: await seller.getAddress(), // 0x00
        zone: await zoneAddr.getAddress(), // 0x20
        offer: [offerItemLeft], // 0x40
        consideration: [considerationItemLeft], // 0x60
        orderType: 0, // 0: no partial fills, anyone can execute
        startTime: 0, //
        endTime: '0xff00000000000000000000000000', // 0xc0
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0xe0
        salt: '0x9d56bd7c39230517f254b5ce4fd292373648067bd5c6d09accbcb3713f328885', // 0x100
        conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000', // 0x120
        totalOriginalConsiderationItems: 1 // 0x140
      };

      const _advancedOrder = {
        parameters: OrderParametersLeft,
        numerator: 1,
        denominator: 1,
        signature: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1b',
        extraData: '0x3c7e9325a7459e2d2258ae8200c465f9a1e913d2cbd7f7f15988ab079f7726494a9a46f9db6e0aaaf8cfab2be8ecf68fed7314817094ca85acc5fbd6a1e192ca1c'
      };

      const _criteriaResolvers = [];
      const _fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const _recipient = await buyerLocal1.getAddress();

      const dataForSeaportWithSelector = await wrapperHelper.getDataSeaPortFulfillAdvancedOrder(_advancedOrder, _criteriaResolvers, _fulfillerConduitKey, _recipient);
      const tradeDataSeaPort = PurchaseData(2, 100, 0, dataForSeaportWithSelector);

      // Error when called not from owner
      await expect(bulkExchange.connect(accounts[5]).pause(true)).to.be.revertedWith('Ownable: caller is not the owner');

      const txPaused = await bulkExchange.pause(true);
      expect(txPaused).to.emit(bulkExchange, 'Paused').withArgs(true);

      expect(await bulkExchange.paused()).to.equal(true);

      // Contract is paused
      await expect(bulkExchange.connect(buyerLocal1).singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, { value: 100 })).to.be.revertedWith('the contract is paused');

      const txUnPause = await bulkExchange.pause(false);
      expect(txUnPause).to.emit(bulkExchange, 'Paused').withArgs(false);

      await bulkExchange.connect(buyerLocal1).singlePurchase(tradeDataSeaPort, ZERO_ADDRESS, ZERO_ADDRESS, { value: 100 });

      expect(await erc721.ownerOf(12345)).to.equal(await buyerLocal1.getAddress());
    });
  });
});
