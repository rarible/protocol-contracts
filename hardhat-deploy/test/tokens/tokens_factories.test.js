const {deployments} = require('hardhat');

const ERC721RaribleMinimal = artifacts.require("ERC721RaribleMinimal.sol");
const ERC721RaribleFactoryC2 = artifacts.require("ERC721RaribleFactoryC2.sol");

const ERC1155RaribleFactoryC2 = artifacts.require("ERC1155RaribleFactoryC2.sol");
const ERC1155Rarible = artifacts.require("ERC1155Rarible.sol");

const ExchangeV2 = artifacts.require("ExchangeV2.sol");
const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

const ERC721Rarible = artifacts.require("ERC721Rarible.sol");

const truffleAssert = require('truffle-assertions');

const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ZERO = "0x0000000000000000000000000000000000000000";

const mint721 = require("../../../scripts/mint721.js");
const mint1155 = require("../../../scripts/mint1155.js");

const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, ORDER_DATA_V2, ORDER_DATA_V3_BUY, ORDER_DATA_V3_SELL, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, CRYPTO_PUNKS, COLLECTION, TO_LOCK, LOCK, enc, id } = require("../../../scripts/assets.js");
const { Order, Asset, sign } = require("../../../scripts/order.js");

contract("Test factories and tokens", accounts => {

  const minter = accounts[1];
  const salt = 3;
  const transferTo = accounts[2];
  const tokenId = minter + "b00000000000000000000001";
  const tokenURI = "//uri";

  const supply = 5;
  const mint = 2;
  let deployed;

  before(async () => {
    deployed = await deployments.fixture()
  });

  describe("rarible collections", () => {
    it("rarible erc721 collection should be able to mint tokens", async () => {
      const token = await ERC721RaribleMinimal.at(deployed["ERC721RaribleMinimal"].address);

      await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, { from: minter });
      assert.equal(await token.ownerOf(tokenId), transferTo, "owner1");
      assert.equal(await token.name(), "Rarible", "name")

      await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
      assert.equal(await token.ownerOf(tokenId), minter, "owner2");
    })

    it("rarible erc1155 collection should be able to mint tokens", async () => {
      const token = await ERC1155Rarible.at(deployed["ERC1155Rarible"].address);

      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, { from: minter });
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.name(), "Rarible", "name")

      await token.safeTransferFrom(transferTo, minter, tokenId, mint, [], { from: transferTo });

      assert.equal(await token.balanceOf(minter, tokenId), mint);
    })
  })

  describe("721 factory", () => {
    it("create public collection from 721 factory, it should be able to mint tokens", async () => {
      const factory = await ERC721RaribleFactoryC2.at(deployed["ERC721RaribleFactoryC2"].address);

      let proxy;
      const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt)

      const resultCreateToken = await factory.methods['createToken(string,string,string,string,uint256)']("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt, { from: minter });
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
      const token = await ERC721RaribleMinimal.at(proxy);

      assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

      await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, { from: minter });
      assert.equal(await token.ownerOf(tokenId), transferTo);
      assert.equal(await token.name(), "name")

      await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
      assert.equal(await token.ownerOf(tokenId), minter);
    })

    it("create private collection from 721 factory, it should be able to mint tokens", async () => {
      const factory = await ERC721RaribleFactoryC2.at(deployed["ERC721RaribleFactoryC2"].address);

      let proxy;
      const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt)

      const resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt, { from: minter });
      truffleAssert.eventEmitted(resultCreateToken, 'Create721RaribleUserProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
      const token = await ERC721RaribleMinimal.at(proxy);

      assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

      await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, { from: minter });
      assert.equal(await token.ownerOf(tokenId), transferTo);
      assert.equal(await token.name(), "name")

      await token.safeTransferFrom(transferTo, minter, tokenId, { from: transferTo });
      assert.equal(await token.ownerOf(tokenId), minter);
    })
  })

  describe("1155 factory", () => {
    it("create public collection from 1155 factory, it should be able to mint tokens", async () => {
      const factory = await ERC1155RaribleFactoryC2.at(deployed["ERC1155RaribleFactoryC2"].address);

      let proxy;
      const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt)

      const resultCreateToken = await factory.methods['createToken(string,string,string,string,uint256)']("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", salt, { from: minter });
      truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
      const token = await ERC1155Rarible.at(proxy);

      assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, { from: minter });
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.name(), "name", "name")

      await token.safeTransferFrom(transferTo, minter, tokenId, mint, [], { from: transferTo });
      assert.equal(await token.balanceOf(minter, tokenId), mint);

    })

    it("create private collection from 1155 factory, it should be able to mint tokens", async () => {
      const factory = await ERC1155RaribleFactoryC2.at(deployed["ERC1155RaribleFactoryC2"].address);

      let proxy;
      const addressBeforeDeploy = await factory.getAddress("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt)

      const resultCreateToken = await factory.createToken("name", "RARI", "https://ipfs.rarible.com", "https://ipfs.rarible.com", [], salt, { from: minter });
      truffleAssert.eventEmitted(resultCreateToken, 'Create1155RaribleUserProxy', (ev) => {
        proxy = ev.proxy;
        return true;
      });
      const token = await ERC1155Rarible.at(proxy);

      assert.equal(proxy, addressBeforeDeploy, "correct address got before deploy")

      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, { from: minter });
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.name(), "name", "name")

      await token.safeTransferFrom(transferTo, minter, tokenId, mint, [], { from: transferTo });
      assert.equal(await token.balanceOf(minter, tokenId), mint);
    })
  })

  describe("lazy mint", () => {
    it("should be able to buy lazy minted erc721-minimal", async () => {
      const token = await ERC721RaribleMinimal.at(deployed["ERC721RaribleMinimal"].address);
      const exchangeV2 = await ExchangeV2.at(deployed["ExchangeV2"].address);
      const helper = await RaribleTestHelper.new();

      const creator = accounts[5];
      const royaltiesReceiver = accounts[6];
      const seller = accounts[7];
      const buyer = accounts[8]
      const buyPrice = 1000;

      const tokenId = creator + "b00000000000000000000002";
      const tokenURI = "//uri";

      const lazyCreators = creators([creator]);
      const lazyFees = fees([royaltiesReceiver]);

      //prepare data for lazy mint, sign it
      const lazyMintSignature = await mint721.sign(creator, tokenId, tokenURI, lazyCreators, lazyFees, token.address)

      //create sell order from maker != creator of nft
      const lazyData = await helper.encodeLazy721([tokenId, tokenURI, lazyCreators, lazyFees, [lazyMintSignature]], token.address)

      const encDataLeft = await helper.encodeV3_SELL([0, 0, 0, 1000, zeroWord]);
      const encDataRight = await helper.encodeV3_BUY([0, 0, 0, zeroWord]);

      let left = Order(seller, Asset(id("ERC721_LAZY"), lazyData, 1), ZERO, Asset(ETH, "0x", buyPrice), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

      let orderSignature = await sign(left, seller, exchangeV2.address);

      //directPurchase order
      let directPurchaseParams = {
        sellOrderMaker: seller,
        sellOrderNftAmount: 1,
        nftAssetClass: id("ERC721_LAZY"),
        nftData: lazyData,
        sellOrderPaymentAmount: buyPrice,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: orderSignature,
        buyOrderPaymentAmount: buyPrice,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      //doesn't work with seller != creator
      await truffleAssert.fails(
        exchangeV2.directPurchase(directPurchaseParams, { from: buyer, value: buyPrice }),
        truffleAssert.ErrorType.REVERT,
        "wrong order maker"
      )

      //making order with seller == creator
      left = Order(creator, Asset(id("ERC721_LAZY"), lazyData, 1), ZERO, Asset(ETH, "0x", buyPrice), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);
      orderSignature = await sign(left, creator, exchangeV2.address);
      directPurchaseParams = {
        sellOrderMaker: creator,
        sellOrderNftAmount: 1,
        nftAssetClass: id("ERC721_LAZY"),
        nftData: lazyData,
        sellOrderPaymentAmount: buyPrice,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: orderSignature,
        buyOrderPaymentAmount: buyPrice,
        buyOrderNftAmount: 1,
        buyOrderData: encDataRight
      };

      //it works now
      await exchangeV2.directPurchase(directPurchaseParams, { from: buyer, value: buyPrice });
      assert.equal(await token.ownerOf(tokenId), buyer)
    })

    it("should be able to buy lazy minted erc1155", async () => {
      const token = await ERC1155Rarible.at(deployed["ERC1155Rarible"].address);
      const exchangeV2 = await ExchangeV2.at(deployed["ExchangeV2"].address);
      const helper = await RaribleTestHelper.new();

      const creator = accounts[5];
      const royaltiesReceiver = accounts[6];
      const seller = accounts[7];
      const buyer = accounts[8]
      const buyPrice = 1000;
      const supply = 10;

      const tokenId = creator + "b00000000000000000000002";
      const tokenURI = "//uri";

      const lazyCreators = creators([creator]);
      const lazyFees = fees([royaltiesReceiver]);

      //prepare data for lazy mint, sign it
      const lazyMintSignature = await mint1155.sign(creator, tokenId, tokenURI, supply, lazyCreators, lazyFees, token.address)

      //create sell order from maker != creator of nft
      const lazyData = await helper.encodeLazy1155([tokenId, tokenURI, supply, lazyCreators, lazyFees, [lazyMintSignature]], token.address)

      const encDataLeft = await helper.encodeV3_SELL([0, 0, 0, 1000, zeroWord]);
      const encDataRight = await helper.encodeV3_BUY([0, 0, 0, zeroWord]);

      let left = Order(seller, Asset(id("ERC1155_LAZY"), lazyData, supply), ZERO, Asset(ETH, "0x", buyPrice), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

      let orderSignature = await sign(left, seller, exchangeV2.address);

      //directPurchase order
      let directPurchaseParams = {
        sellOrderMaker: seller,
        sellOrderNftAmount: supply,
        nftAssetClass: id("ERC1155_LAZY"),
        nftData: lazyData,
        sellOrderPaymentAmount: buyPrice,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: orderSignature,
        buyOrderPaymentAmount: buyPrice,
        buyOrderNftAmount: supply,
        buyOrderData: encDataRight
      };

      //doesn't work with seller != creator
      await truffleAssert.fails(
        exchangeV2.directPurchase(directPurchaseParams, { from: buyer, value: buyPrice }),
        truffleAssert.ErrorType.REVERT,
        "wrong order maker"
      )

      left = Order(creator, Asset(id("ERC1155_LAZY"), lazyData, supply), ZERO, Asset(ETH, "0x", buyPrice), 1, 0, 0, ORDER_DATA_V3_SELL, encDataLeft);

      orderSignature = await sign(left, creator, exchangeV2.address);

      //directPurchase order
      directPurchaseParams = {
        sellOrderMaker: creator,
        sellOrderNftAmount: supply,
        nftAssetClass: id("ERC1155_LAZY"),
        nftData: lazyData,
        sellOrderPaymentAmount: buyPrice,
        paymentToken: ZERO,
        sellOrderSalt: 1,
        sellOrderStart: 0,
        sellOrderEnd: 0,
        sellOrderDataType: ORDER_DATA_V3_SELL,
        sellOrderData: encDataLeft,
        sellOrderSignature: orderSignature,
        buyOrderPaymentAmount: buyPrice,
        buyOrderNftAmount: supply,
        buyOrderData: encDataRight
      };

      //works with creator == seller
      const tx = await exchangeV2.directPurchase(directPurchaseParams, { from: buyer, value: buyPrice });
      assert.equal(await token.balanceOf(buyer, tokenId), supply)
    })

  })

  function creators(list) {
    const value = 10000 / list.length
    return list.map(account => ({ account, value }))
  }

  function fees(list) {
    const value = 500;
    return list.map(account => ({ account, value }))
  }

});