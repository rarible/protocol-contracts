// <ai_context> Test suite for RoyaltiesRegistry contract. Covers various royalty types (V1, V2, 2981, providers like ArtBlocks, V2Legacy), setting methods, and edge cases. Ported from Truffle to Hardhat with TypeChain. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const connection = await network.connect();
const { ethers } = connection;
import type * as ethersTypes from "ethers";
import {
  type RoyaltiesRegistry,
  RoyaltiesRegistry__factory,
  type RoyaltiesRegistryTest,
  RoyaltiesRegistryTest__factory,
  type TestERC721WithRoyaltiesV1OwnableUpgradeable,
  TestERC721WithRoyaltiesV1OwnableUpgradeable__factory,
  type TestERC721WithRoyaltiesV2OwnableUpgradeable,
  TestERC721WithRoyaltiesV2OwnableUpgradeable__factory,
  type RoyaltiesProviderTest,
  RoyaltiesProviderTest__factory,
  type TestERC721RoyaltyV2Legacy,
  TestERC721RoyaltyV2Legacy__factory,
  type RoyaltiesProviderV2Legacy,
  RoyaltiesProviderV2Legacy__factory,
  type TestERC721ArtBlocks,
  TestERC721ArtBlocks__factory,
  type RoyaltiesProviderArtBlocks,
  RoyaltiesProviderArtBlocks__factory,
  type TestERC721WithRoyaltyV2981,
  TestERC721WithRoyaltyV2981__factory,
  type TestERC721ArtBlocksV2,
  TestERC721ArtBlocksV2__factory,
  type RoyaltiesProviderArtBlocksV2,
  RoyaltiesProviderArtBlocksV2__factory,
} from "../types/ethers-contracts/index.js";
import { deployTransparentProxy } from "@rarible/test/src/index.js";

describe("RoyaltiesRegistry, test methods", function () {
  let royaltiesRegistry: RoyaltiesRegistry;
  let royaltiesRegistryTest: RoyaltiesRegistryTest;
  let testRoyaltiesProvider: RoyaltiesProviderTest;
  let erc721TokenId1 = 51n;
  let erc721TokenId2 = 52n;

  before(async function () {
    const [deployer] = await ethers.getSigners();
    const { instance: royaltiesRegistryInstance } = await deployTransparentProxy<RoyaltiesRegistry>(ethers, {
      contractName: "RoyaltiesRegistry",
      initFunction: "__RoyaltiesRegistry_init",
      initArgs: [],
      proxyOwner: deployer.address,
    });
    royaltiesRegistry = royaltiesRegistryInstance;
    royaltiesRegistryTest = await new RoyaltiesRegistryTest__factory(deployer).deploy();
    testRoyaltiesProvider = await new RoyaltiesProviderTest__factory(deployer).deploy();
  });

  describe("RoyaltiesRegistry token supports IERC2981:", () => {
    it("Get 10% royalties by token, use RoyaltiesRegistryTest (event) ", async function () {
      const [_, acc1] = await ethers.getSigners();
      const getRoyalties = await acc1.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      const ERC721_V2981 = await new TestERC721WithRoyaltyV2981__factory(acc1).deploy();
      await ERC721_V2981.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set 2981 interface

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V2981.getAddress(),
        tokenId,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties.length).to.equal(1);
      expect(royalties[0].value).to.equal(1000n);
      expect(royalties[0].account).to.equal(getRoyalties);
    });

    it("Get different % 2981 royalties by token", async function () {
      const [_, acc1] = await ethers.getSigners();
      const getRoyalties = await acc1.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      const ERC721_V2981 = await new TestERC721WithRoyaltyV2981__factory(acc1).deploy();
      await ERC721_V2981.initialize("Rarible", "RARI", "https://ipfs.rarible.com");

      // royalties 4.2%
      await ERC721_V2981.setRoyalties(420n);
      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V2981.getAddress(),
        tokenId,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;
      expect(royalties[0].value).to.equal(420n);
      expect(royalties[0].account).to.equal(getRoyalties);
      expect(royalties.length).to.equal(1);

      // royalties 0.01%
      await ERC721_V2981.setRoyalties(1n);
      const tx2 = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V2981.getAddress(),
        tokenId,
      );
      const receipt2 = await tx2.wait();
      const event2 = receipt2?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties2 = (event2?.args as any).royalties;
      expect(royalties2[0].value).to.equal(1n);
      expect(royalties2[0].account).to.equal(getRoyalties);
      expect(royalties2.length).to.equal(1);

      // royalties 50%
      await ERC721_V2981.setRoyalties(5000n);
      const tx3 = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V2981.getAddress(),
        tokenId,
      );
      const receipt3 = await tx3.wait();
      const event3 = receipt3?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties3 = (event3?.args as any).royalties;
      expect(royalties3[0].value).to.equal(5000n);
      expect(royalties3[0].account).to.equal(getRoyalties);
      expect(royalties3.length).to.equal(1);
    });

    it("Get 10% royalties by token, use RoyaltiesRegistry (call)", async function () {
      const [_, acc1] = await ethers.getSigners();
      const getRoyalties = await acc1.getAddress();
      const tokenId = (BigInt(getRoyalties) << 96n) | 1n;
      const ERC721_V2981 = await new TestERC721WithRoyaltyV2981__factory(acc1).deploy();
      await ERC721_V2981.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set 2981 interface
      const part = await royaltiesRegistry.getRoyalties.staticCall(await ERC721_V2981.getAddress(), tokenId);
      expect(part[0].value).to.equal(1000n);
      expect(part[0].account).to.equal(getRoyalties);
      expect(part.length).to.equal(1);
    });
  });

  describe("RoyaltiesRegistry methods works:", () => {
    it("simple V1 royalties", async function () {
      const [_, __, acc2, ___, ____, acc5, _____, acc7] = await ethers.getSigners();
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(acc2).deploy();
      await ERC721_V1OwnUpgrd.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await ERC721_V1OwnUpgrd.mint(acc2.address, erc721TokenId1, [
        { account: acc5.address, value: 1000n },
        { account: acc7.address, value: 1200n },
      ]); //set royalties by contract

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties[0].value).to.equal(1000n);
      expect(royalties[1].value).to.equal(1200n);
      expect(royalties.length).to.equal(2);
    });

    it("simple V1 royalties, set empty, check empty", async function () {
      const [_, __, acc2] = await ethers.getSigners();
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(acc2).deploy();
      await ERC721_V1OwnUpgrd.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface
      await ERC721_V1OwnUpgrd.mint(acc2.address, erc721TokenId1, []); //set royalties by contract empty

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties.length).to.equal(0);
    });

    it("simple V2 royalties", async function () {
      const [_, __, acc2, ___, ____, acc5, acc6, acc7, acc8] = await ethers.getSigners();
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(acc2).deploy();
      await ERC721_V2OwnUpgrd.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V2 interface
      await ERC721_V2OwnUpgrd.mint(acc2.address, erc721TokenId1, [
        { account: acc5.address, value: 700n },
        { account: acc6.address, value: 800n },
        { account: acc7.address, value: 900n },
        { account: acc8.address, value: 1000n },
      ]); //set royalties by contract

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V2OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties[0].value).to.equal(700n);
      expect(royalties[1].value).to.equal(800n);
      expect(royalties[2].value).to.equal(900n);
      expect(royalties[3].value).to.equal(1000n);
      expect(royalties.length).to.equal(4);
    });

    it("simple V2 royalties, set empty, check empty", async function () {
      const [_, __, acc2] = await ethers.getSigners();
      const ERC721_V2OwnUpgrd = await new TestERC721WithRoyaltiesV2OwnableUpgradeable__factory(acc2).deploy();
      await ERC721_V2OwnUpgrd.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V2 interface
      await ERC721_V2OwnUpgrd.mint(acc2.address, erc721TokenId1, []); //set royalties by contract empty

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V2OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties.length).to.equal(0);
    });

    it("SetRoyaltiesByToken, initialize by Owner, emit get", async function () {
      const [_, __, ___, acc3, acc4, acc5] = await ethers.getSigners();
      await royaltiesRegistry.setRoyaltiesByToken(acc5.address, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //set royalties by token and tokenId
      await royaltiesRegistry.setRoyaltiesByToken(acc5.address, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //set royalties by token and tokenId

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        acc5.address,
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties.length).to.equal(2);
      expect(royalties[0].value).to.equal(600n);
      expect(royalties[1].value).to.equal(1100n);
    });

    it("SetRoyaltiesByToken, initialize by OwnableUpgradaeble(ERC721_V1OwnUpgrd).owner", async function () {
      const ownerErc721 = (await ethers.getSigners())[6];
      const [_, __, acc2, acc3, acc4] = await ethers.getSigners();

      const ERC721_V1OwnUpgrd =
        await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(ownerErc721).deploy();
      await ERC721_V1OwnUpgrd.connect(ownerErc721).initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      await ERC721_V1OwnUpgrd.connect(ownerErc721).mint(acc2.address, erc721TokenId1, []);

      await royaltiesRegistry
        .connect(ownerErc721)
        .setRoyaltiesByToken(await ERC721_V1OwnUpgrd.getAddress(), [
          { account: acc3.address, value: 500n },
          { account: acc4.address, value: 1000n },
        ]); //set royalties by token and tokenId

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties[0].value).to.equal(500n);
      expect(royalties[1].value).to.equal(1000n);
    });
  });

  describe("ExternalProviders test:", () => {
    it("using royaltiesProvider v2 legacy", async function () {
      const [_, acc1, acc2] = await ethers.getSigners();
      const token = await new TestERC721RoyaltyV2Legacy__factory(acc2).deploy();
      await token.initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await new RoyaltiesProviderV2Legacy__factory(acc2).deploy();

      await royaltiesRegistry.setProviderByToken(await token.getAddress(), await provider.getAddress());
      const royaltiesToSet = [{ account: acc1.address, value: 1000n }];
      await token.mint(acc2.address, erc721TokenId1);
      await token._saveRoyalties(erc721TokenId1, royaltiesToSet);

      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await token.getAddress(), erc721TokenId1);
      expect(royalties[0].account).to.equal(royaltiesToSet[0].account, "royalty recepient 0");
      expect(royalties[0].value).to.equal(royaltiesToSet[0].value, "token address 0");
    });

    it("using royaltiesProvider artBlocks", async function () {
      const [_, __, acc2, ___, acc4, acc5, acc6] = await ethers.getSigners();
      const artBlocksAddr = acc5.address;
      const artistAdrr = acc2.address;
      const addPayeeAddr = acc4.address;

      //deploying contracts
      const token = await new TestERC721ArtBlocks__factory(acc2).deploy();
      await token.initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await new RoyaltiesProviderArtBlocks__factory(acc5).deploy(acc5.address);

      expect(await provider.owner()).to.equal(artBlocksAddr, "owner");
      expect(await provider.artblocksPercentage()).to.equal(250n, "artblocksPercentage");

      //setting provider in registry
      await royaltiesRegistry.setProviderByToken(await token.getAddress(), await provider.getAddress());

      //creating token and setting royalties
      await token.mint(artistAdrr, erc721TokenId1);
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 44n);
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15n);

      //getting royalties for token
      const royaltiesFromProvider = await provider.getRoyalties(await token.getAddress(), erc721TokenId1);
      expect(royaltiesFromProvider[0].account).to.equal(artBlocksAddr, "artBlocks royalty address");
      expect(royaltiesFromProvider[0].value).to.equal(250n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider[1].account).to.equal(artistAdrr, "artist royalty address");
      expect(royaltiesFromProvider[1].value).to.equal(840n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider[2].account).to.equal(addPayeeAddr, "additional payee royalty address");
      expect(royaltiesFromProvider[2].value).to.equal(660n, "additional payee royalty percentage");

      //changing artBlocksAddr
      const newArtBlocksAddr = acc6.address;
      const txSetAddr = await provider.connect(acc5).transferOwnership(newArtBlocksAddr);
      const receiptSet = await txSetAddr.wait();
      const eventSetAddr = receiptSet?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "OwnershipTransferred",
      ) as ethersTypes.EventLog | undefined;
      const { previousOwner, newOwner } = (eventSetAddr?.args as any) as {
        previousOwner: string;
        newOwner: string;
      };

      expect(previousOwner).to.equal(artBlocksAddr, "from artBlocks addr");
      expect(newOwner).to.equal(newArtBlocksAddr, "to artBlocks addr");
      await expect(provider.connect(acc5).transferOwnership(artBlocksAddr)).to.be.revert;

      //checking royalties
      const royalties = await royaltiesRegistry.getRoyalties.staticCall(await token.getAddress(), erc721TokenId1);
      expect(royalties[0].account).to.equal(newArtBlocksAddr, "artBlocks addr");
      expect(royalties[0].value).to.equal(250n, "artBlocks value");
      expect(royalties[1].account).to.equal(artistAdrr, "artist addr");
      expect(royalties[1].value).to.equal(840n, "artist value");
      expect(royalties[2].account).to.equal(addPayeeAddr, "additional payee addr");
      expect(royalties[2].value).to.equal(660n, "additional payee value");

      //setting new artblocksPercentage
      const txChangePercentage = await provider.connect(acc6).setArtblocksPercentage(300n);
      const receiptChange = await txChangePercentage.wait();
      const eventChangePercentage = receiptChange?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "ArtblocksPercentageChanged",
      ) as ethersTypes.EventLog | undefined;
      const artblocksArgs = (eventChangePercentage?.args as any) as {
        _who: string;
        _old: bigint;
        _new: bigint;
      };

      expect(artblocksArgs._who).to.equal(newArtBlocksAddr, "from artBlocks addr");
      expect(artblocksArgs._old).to.equal(250n, "old percentage");
      expect(artblocksArgs._new).to.equal(300n, "new percentage");

      //only owner can set %
      await expect(provider.connect(acc5).setArtblocksPercentage(0n)).to.be.revert;
      // _artblocksPercentage can't be over 10000
      await expect(provider.connect(acc6).setArtblocksPercentage(100000n)).to.be.revert;
    });

    it("using royaltiesProvider artBlocks royalties edge cases", async function () {
      const [_, __, acc2, ___, acc4, acc5] = await ethers.getSigners();
      const artBlocksAddr = acc5.address;
      const artistAdrr = acc2.address;
      const addPayeeAddr = acc4.address;

      //deploying contracts
      const token = await new TestERC721ArtBlocks__factory(acc2).deploy();
      await token.initialize("Rarible", "RARI", "https://ipfs.rarible.com");
      const provider = await new RoyaltiesProviderArtBlocks__factory(acc5).deploy(acc5.address);
      expect(await provider.owner()).to.equal(artBlocksAddr, "owner");
      expect(await provider.artblocksPercentage()).to.equal(250n, "artblocksPercentage");

      //setting provider in registry
      await royaltiesRegistry.setProviderByToken(await token.getAddress(), await provider.getAddress());

      //creating token and setting royalties
      await token.mint(artistAdrr, erc721TokenId1);
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0n);
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 15n);

      //getting royalties for token
      //case artist = 15% additionalPatee = 0
      const royaltiesFromProvider = await provider.getRoyalties(await token.getAddress(), erc721TokenId1);
      expect(royaltiesFromProvider[0].account).to.equal(artBlocksAddr, "artBlocks royalty address");
      expect(royaltiesFromProvider[0].value).to.equal(250n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider[1].account).to.equal(artistAdrr, "artist royalty address");
      expect(royaltiesFromProvider[1].value).to.equal(1500n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider.length).to.equal(2, "should be 2 royalties");

      //case artist = 15%, additionalPayee = 100% of 15%
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 100n);
      const royaltiesFromProvider2 = await provider.getRoyalties(await token.getAddress(), erc721TokenId1);
      expect(royaltiesFromProvider2[0].account).to.equal(artBlocksAddr, "artBlocks royalty address");
      expect(royaltiesFromProvider2[0].value).to.equal(250n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider2[1].account).to.equal(addPayeeAddr, "artist royalty address");
      expect(royaltiesFromProvider2[1].value).to.equal(1500n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider2.length).to.equal(2, "should be 2 royalties");

      //case additionalPayee > 100
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 110n);
      await expect(provider.getRoyalties(await token.getAddress(), erc721TokenId1)).to.be.revert;
      await token.updateProjectAdditionalPayeeInfo(erc721TokenId1, addPayeeAddr, 0n);

      //case artist > 100
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 110n);
      await expect(provider.getRoyalties(await token.getAddress(), erc721TokenId1)).to.be.revert;
      await token.updateProjectSecondaryMarketRoyaltyPercentage(erc721TokenId1, 0n);

      //case artist = 0, additionalPayee = 0
      const royaltiesFromProvider3 = await provider.getRoyalties(await token.getAddress(), erc721TokenId1);
      expect(royaltiesFromProvider3[0].account).to.equal(artBlocksAddr, "artBlocks royalty address");
      expect(royaltiesFromProvider3[0].value).to.equal(250n, "artBlocks royalty percentage");
      expect(royaltiesFromProvider3.length).to.equal(1, "should be 1 royalties");

      //case artist = 0, additionalPayee = 0, artBlocks = 0
      await provider.connect(acc5).setArtblocksPercentage(0n);
      const royaltiesFromProvider4 = await provider.getRoyalties(await token.getAddress(), erc721TokenId1);
      expect(royaltiesFromProvider4.length).to.equal(0, "should be 0 royalties");
    });

    it("using royaltiesProvider artBlocksV2", async function () {
      const [_, __, acc2] = await ethers.getSigners();
      const artistAdrr = acc2.address;
      const tokenID = 455000355n;
      const recipient0 = "0x21E0106F464770F528A491383A1957569F886Dc7";
      const recipient1 = "0xC40FD6D2A8e06ba753F6Fd3CB562835Eff990b51";
      const bps0 = 1000n;
      const bps1 = 250n;

      const token = await new TestERC721ArtBlocksV2__factory(acc2).deploy();
      await token.initialize("ArtBlockV2", "ABV2", "");
      const provider = await new RoyaltiesProviderArtBlocksV2__factory(acc2).deploy();

      //setting provider in registry
      await royaltiesRegistry.setProviderByToken(await token.getAddress(), await provider.getAddress());

      //creating token and setting royalties
      await token.mint(artistAdrr, tokenID);
      await token.setRoyalties(tokenID, [recipient0, recipient1], [bps0, bps1]);

      const royaltiesFromProvider = await provider.getRoyalties(await token.getAddress(), tokenID);
      expect(royaltiesFromProvider[0].account).to.equal(recipient0);
      expect(royaltiesFromProvider[1].account).to.equal(recipient1);
      expect(royaltiesFromProvider[0].value).to.equal(bps0);
      expect(royaltiesFromProvider[1].value).to.equal(bps1);
    });

    it("SetProviderByToken, initialize by Owner", async function () {
      const [_, __, acc2, acc3, acc4] = await ethers.getSigners();
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(acc2).deploy();
      await ERC721_V1OwnUpgrd.initialize("Rarible", "RARI", "https://ipfs.rarible.com");

      await testRoyaltiesProvider.initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 500n },
        { account: acc4.address, value: 1000n },
      ]); //initialize royalties provider

      await ERC721_V1OwnUpgrd.mint(acc2.address, erc721TokenId1, []);
      await royaltiesRegistry.setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties[0].value).to.equal(500n);
      expect(royalties[1].value).to.equal(1000n);
    });

    it("SetProviderByToken + ContractRoyalties, which not work, because royalties detect by provider, initialize by Owner", async function () {
      const [_, __, acc2, acc3, acc4, acc5, _____, acc7] = await ethers.getSigners();
      const ERC721_V1OwnUpgrd = await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(acc2).deploy();
      await ERC721_V1OwnUpgrd.initialize("Rarible", "RARI", "https://ipfs.rarible.com"); //set V1 interface

      await testRoyaltiesProvider.initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: await acc3.getAddress(), value: 500n },
        { account: await acc4.getAddress(), value: 1000n },
      ]); //initialize royalties provider

      await ERC721_V1OwnUpgrd.mint(acc2.address, erc721TokenId1, [
        { account: acc5.address, value: 1000n },
        { account: acc7.address, value: 1200n },
      ]); //set royalties by contract

      await royaltiesRegistry.setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties[0].value).to.equal(500n);
      expect(royalties[1].value).to.equal(1000n);
      expect(royalties.length).to.equal(2);
    });

    it("SetProviderByToken, initialize by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner ", async function () {
      const ownerErc721 = (await ethers.getSigners())[6];
      const [_, __, acc2, acc3, acc4] = await ethers.getSigners();

      const ERC721_V1OwnUpgrd =
        await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(ownerErc721).deploy();
      await ERC721_V1OwnUpgrd.connect(ownerErc721).initialize("Rarible", "RARI", "https://ipfs.rarible.com");

      await testRoyaltiesProvider.initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //initialize royalties provider

      await ERC721_V1OwnUpgrd.connect(ownerErc721).mint(acc2.address, erc721TokenId1, []);

      await royaltiesRegistry
        .connect(ownerErc721)
        .setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId1,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties[0].value).to.equal(600n);
      expect(royalties[1].value).to.equal(1100n);
      expect(royalties.length).to.equal(2);
    });

    it("SetProviderByToken, initialize by ownableUpgradaeble(ERC721_V1OwnUpgrd).owner, royalties for erc721TokenId2 should be empty", async function () {
      const ownerErc721 = (await ethers.getSigners())[6];
      const [_, __, acc2, acc3, acc4] = await ethers.getSigners();

      const ERC721_V1OwnUpgrd =
        await new TestERC721WithRoyaltiesV1OwnableUpgradeable__factory(ownerErc721).deploy();
      await ERC721_V1OwnUpgrd.connect(ownerErc721).initialize("Rarible", "RARI", "https://ipfs.rarible.com");

      await testRoyaltiesProvider.initializeProvider(await ERC721_V1OwnUpgrd.getAddress(), erc721TokenId1, [
        { account: acc3.address, value: 600n },
        { account: acc4.address, value: 1100n },
      ]); //initialize royalties provider

      await ERC721_V1OwnUpgrd.connect(ownerErc721).mint(acc2.address, erc721TokenId2, []);

      await royaltiesRegistry
        .connect(ownerErc721)
        .setProviderByToken(await ERC721_V1OwnUpgrd.getAddress(), await testRoyaltiesProvider.getAddress()); //set royalties by provider

      const tx = await royaltiesRegistryTest._getRoyalties(
        await royaltiesRegistry.getAddress(),
        await ERC721_V1OwnUpgrd.getAddress(),
        erc721TokenId2,
      );
      const receipt = await tx.wait();
      const event = receipt?.logs?.find(
        log => (log as ethersTypes.EventLog).fragment?.name === "getRoyaltiesTest",
      ) as ethersTypes.EventLog | undefined;
      const royalties = (event?.args as any).royalties;

      expect(royalties.length).to.equal(0);
    });
  });
});
