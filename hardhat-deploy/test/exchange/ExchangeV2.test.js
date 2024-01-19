const truffleAssert = require('truffle-assertions');
const { deployments } = require('hardhat');

const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721RoyaltiesV1 = artifacts.require("TestERC721RoyaltiesV1.sol");
const TestERC721RoyaltiesV2 = artifacts.require("TestERC721RoyaltiesV2.sol");
const TestERC1155RoyaltiesV2 = artifacts.require("TestERC1155RoyaltiesV2.sol");

//RARIBLE
const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");

const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");
//Lazy
const ERC721LazyMintTest = artifacts.require("ERC721LazyMintTest.sol");

const { Order, Asset, sign } = require("../../../scripts/order.js");
const ZERO = "0x0000000000000000000000000000000000000000";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../../scripts/assets.js");
const MARKET_MARKER_SELL = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f10";
const MARKET_MARKER_BUY = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2f11";

const { verifyBalanceChangeReturnTx } = require("../../../scripts/balance")

contract("ExchangeV2, sellerFee + buyerFee =  6%,", accounts => {
  let exchangeV2;
  let transferProxy;
  let erc20TransferProxy;
  let helper;

  const makerLeft = accounts[1];
  const makerRight = accounts[2];

  const protocol = accounts[9];
  const community = accounts[8];

  const erc721TokenId1 = 53;
  const erc1155TokenId1 = 54;

  before(async () => {
    const deployed = await deployments.fixture(['all'])
    //transfer proxes
    transferProxy = await TransferProxy.at(deployed["TransferProxy"].address);
    erc20TransferProxy = await ERC20TransferProxy.at(deployed["ERC20TransferProxy"].address);

    //royaltiesRegistry
    royaltiesRegistry = await RoyaltiesRegistry.at(deployed["RoyaltiesRegistry"].address)

    /*Auction*/
    exchangeV2 = await ExchangeV2.at(deployed["ExchangeV2"].address);

    helper = await RaribleTestHelper.new()
  });

  describe("gas estimation", () => {

    it("ERC721<->ETH, not same origin, not same royalties V2", async () => {
      const price = 0;
      const salt = 1;
      const nftAmount = 1
      const erc721 = await prepareERC721(makerLeft);

      let addrOriginLeft = [[accounts[6], 300]];
      let addrOriginRight = [[accounts[5], 300]];

      let encDataLeft = await encDataV2([[], addrOriginLeft, true]);
      let encDataRight = await encDataV2([[], addrOriginRight, false]);

      const left = Order(makerLeft, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), ZERO, Asset(ETH, "0x", price), salt, 0, 0, ORDER_DATA_V2, encDataLeft);
      const right = Order(makerRight, Asset(ETH, "0x", price), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), nftAmount), 0, 0, 0, ORDER_DATA_V2, encDataRight);
      const signature = await getSignature(left, makerLeft);

      const tx = await exchangeV2.matchOrders(left, signature, right, "0x", { from: makerRight, value: 200 });
      console.log("ERC721<->ETH, not same origin, not same royalties V2:", tx.receipt.gasUsed);
    })

  })

  function encDataV1(tuple) {
    return helper.encode(tuple);
  }

  function encDataV2(tuple) {
    return helper.encodeV2(tuple);
  }

  async function LibPartToUint(account = zeroAddress, value = 0) {
    return await helper.encodeOriginFeeIntoUint(account, value);
  }

  async function prepareERC20(user, value = 1000) {
    const erc20Token = await TestERC20.new();

    await erc20Token.mint(user, value);
    await erc20Token.approve(erc20TransferProxy.address, value, { from: user });
    return erc20Token;
  }

  async function prepareERC721(user, tokenId = erc721TokenId1, royalties = []) {
    const erc721 = await TestERC721RoyaltiesV2.new();
    await erc721.initialize();

    await erc721.mint(user, tokenId, royalties);
    await erc721.setApprovalForAll(transferProxy.address, true, { from: user });
    return erc721;
  }

  async function prepareERC721Lazy() {
    const erc721Lazy = await ERC721LazyMintTest.new();
    return erc721Lazy;
  }

  async function prepareERC1155(user, value = 100, tokenId = erc1155TokenId1, royalties = []) {
    const erc1155 = await TestERC1155RoyaltiesV2.new();
    await erc1155.initialize();

    await erc1155.mint(user, tokenId, value, royalties);
    await erc1155.setApprovalForAll(transferProxy.address, true, { from: user });
    return erc1155;
  }

  async function getSignature(order, signer) {
    return sign(order, signer, exchangeV2.address);
  }

});
