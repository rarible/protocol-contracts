import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import {
  LiveDropFactory,
  LiveDropFactory__factory,
  LiveDropCollection,
  LiveDropCollection__factory,
  MockERC20,
  MockERC20__factory,
} from "../typechain-types";
import "@nomicfoundation/hardhat-chai-matchers";

describe("LiveDropCollection", function () {
  let factory: LiveDropFactory;
  let collection: LiveDropCollection;
  let mockUsdc: MockERC20;
  let owner: SignerWithAddress; // factory owner
  let feeRecipient: SignerWithAddress;
  let creator: SignerWithAddress; // collection owner
  let minter: SignerWithAddress;
  let recipient: SignerWithAddress;
  let other: SignerWithAddress;

  const FEE_BPS = 500; // 5%
  const FEE_FIXED_NATIVE = 0;
  const FEE_FIXED_ERC20 = 0;

  const collectionConfig = {
    name: "Stream Drop #1",
    symbol: "SD1",
    description: "First live stream drop",
    icon: "https://example.com/icon.png",
    tokenMetaName: "Stream Token",
    tokenMetaDescription: "A token from the live stream",
    tokenMetaImage: "https://example.com/token.png",
  };

  /**
   * Helper: create factory + collection for each test
   */
  async function deployFixture() {
    [owner, feeRecipient, creator, minter, recipient, other] =
      await ethers.getSigners();

    // Deploy mock USDC (6 decimals)
    const MockERC20Factory = (await ethers.getContractFactory(
      "MockERC20"
    )) as MockERC20__factory;
    mockUsdc = await MockERC20Factory.deploy("USD Coin", "USDC", 6);
    await mockUsdc.deployed();

    // Deploy factory
    const FactoryFactory = (await ethers.getContractFactory(
      "LiveDropFactory"
    )) as LiveDropFactory__factory;
    factory = await FactoryFactory.deploy(
      owner.address,
      feeRecipient.address,
      FEE_BPS,
      FEE_FIXED_NATIVE,
      FEE_FIXED_ERC20,
      mockUsdc.address
    );
    await factory.deployed();

    // Create collection as `creator`
    const tx = await factory
      .connect(creator)
      .createCollection(collectionConfig);
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === "CollectionCreated");
    const collectionAddr = event!.args!.collection;

    collection = LiveDropCollection__factory.connect(collectionAddr, creator);
  }

  beforeEach(async function () {
    await deployFixture();
  });

  // ==========================================================================
  //                          MINT NATIVE
  // ==========================================================================

  describe("Mint Native", function () {
    it("should mint NFT and distribute payments correctly", async function () {
      const amount = ethers.utils.parseEther("1"); // 1 ETH
      const expectedFee = amount.mul(FEE_BPS).div(10000); // 0.05 ETH
      const expectedRemainder = amount.sub(expectedFee); // 0.95 ETH

      const creatorBalBefore = await ethers.provider.getBalance(
        creator.address
      );
      const feeRecipientBalBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );

      const tx = await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });
      const receipt = await tx.wait();

      // Check NFT was minted
      expect(await collection.ownerOf(0)).to.equal(minter.address);
      expect(await collection.totalSupply()).to.equal(1);

      // Check payments
      const creatorBalAfter = await ethers.provider.getBalance(creator.address);
      const feeRecipientBalAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );

      expect(creatorBalAfter.sub(creatorBalBefore)).to.equal(expectedRemainder);
      expect(feeRecipientBalAfter.sub(feeRecipientBalBefore)).to.equal(
        expectedFee
      );

      // Check event
      const event = receipt.events?.find((e) => e.event === "MintedNative");
      expect(event).to.not.be.undefined;
      expect(event!.args!.to).to.equal(minter.address);
      expect(event!.args!.tokenId).to.equal(0);
      expect(event!.args!.amount).to.equal(amount);
      expect(event!.args!.fee).to.equal(expectedFee);
    });

    it("should mint to a different recipient", async function () {
      const amount = ethers.utils.parseEther("1");

      await collection
        .connect(minter)
        .mintNative(recipient.address, amount, { value: amount });

      expect(await collection.ownerOf(0)).to.equal(recipient.address);
    });

    it("should refund excess value", async function () {
      const amount = ethers.utils.parseEther("1");
      const excess = ethers.utils.parseEther("0.5");
      const totalSent = amount.add(excess);

      const minterBalBefore = await ethers.provider.getBalance(minter.address);

      const tx = await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: totalSent });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const minterBalAfter = await ethers.provider.getBalance(minter.address);

      // Minter should have lost exactly `amount + gas`, not `totalSent + gas`
      const expectedLoss = amount.add(gasCost);
      expect(minterBalBefore.sub(minterBalAfter)).to.equal(expectedLoss);
    });

    it("should revert if amount is 0", async function () {
      await expect(
        collection.connect(minter).mintNative(minter.address, 0, { value: 0 })
      ).to.be.revertedWithCustomError(collection, "InvalidAmount");
    });

    it("should revert if msg.value < amount", async function () {
      const amount = ethers.utils.parseEther("1");
      const sent = ethers.utils.parseEther("0.5");

      await expect(
        collection
          .connect(minter)
          .mintNative(minter.address, amount, { value: sent })
      ).to.be.revertedWithCustomError(collection, "InsufficientValue");
    });

    it("should increment token IDs", async function () {
      const amount = ethers.utils.parseEther("1");

      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });
      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });
      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      expect(await collection.ownerOf(0)).to.equal(minter.address);
      expect(await collection.ownerOf(1)).to.equal(minter.address);
      expect(await collection.ownerOf(2)).to.equal(minter.address);
      expect(await collection.totalSupply()).to.equal(3);
    });

    it("should revert when paused", async function () {
      await collection.connect(creator).pause();
      const amount = ethers.utils.parseEther("1");

      await expect(
        collection
          .connect(minter)
          .mintNative(minter.address, amount, { value: amount })
      ).to.be.revertedWithCustomError(collection, "EnforcedPause");
    });
  });

  // ==========================================================================
  //                          MINT ERC-20
  // ==========================================================================

  describe("Mint ERC-20", function () {
    const USDC_AMOUNT = BigNumber.from(10_000_000); // 10 USDC (6 decimals)

    beforeEach(async function () {
      // Give minter some USDC and approve
      await mockUsdc.mint(minter.address, USDC_AMOUNT.mul(100));
      await mockUsdc.connect(minter).approve(collection.address, USDC_AMOUNT.mul(100));
    });

    it("should mint NFT and distribute ERC-20 payments", async function () {
      const expectedFee = USDC_AMOUNT.mul(FEE_BPS).div(10000); // 500000 (0.5 USDC)
      const expectedRemainder = USDC_AMOUNT.sub(expectedFee); // 9500000 (9.5 USDC)

      const creatorBalBefore = await mockUsdc.balanceOf(creator.address);
      const feeRecipientBalBefore = await mockUsdc.balanceOf(
        feeRecipient.address
      );

      const tx = await collection
        .connect(minter)
        .mintErc20(minter.address, USDC_AMOUNT);
      const receipt = await tx.wait();

      // Check NFT
      expect(await collection.ownerOf(0)).to.equal(minter.address);
      expect(await collection.totalSupply()).to.equal(1);

      // Check payments
      const creatorBalAfter = await mockUsdc.balanceOf(creator.address);
      const feeRecipientBalAfter = await mockUsdc.balanceOf(
        feeRecipient.address
      );

      expect(creatorBalAfter.sub(creatorBalBefore)).to.equal(expectedRemainder);
      expect(feeRecipientBalAfter.sub(feeRecipientBalBefore)).to.equal(
        expectedFee
      );

      // Check event
      const event = receipt.events?.find((e) => e.event === "MintedErc20");
      expect(event).to.not.be.undefined;
      expect(event!.args!.to).to.equal(minter.address);
      expect(event!.args!.tokenId).to.equal(0);
      expect(event!.args!.amount).to.equal(USDC_AMOUNT);
      expect(event!.args!.fee).to.equal(expectedFee);
    });

    it("should mint to a different recipient", async function () {
      await collection
        .connect(minter)
        .mintErc20(recipient.address, USDC_AMOUNT);

      expect(await collection.ownerOf(0)).to.equal(recipient.address);
    });

    it("should revert if amount is 0", async function () {
      await expect(
        collection.connect(minter).mintErc20(minter.address, 0)
      ).to.be.revertedWithCustomError(collection, "InvalidAmount");
    });

    it("should revert if no allowance", async function () {
      // Reset allowance
      await mockUsdc.connect(minter).approve(collection.address, 0);

      await expect(
        collection.connect(minter).mintErc20(minter.address, USDC_AMOUNT)
      ).to.be.reverted;
    });

    it("should revert if insufficient balance", async function () {
      const hugeAmount = USDC_AMOUNT.mul(10000);
      await mockUsdc.connect(minter).approve(collection.address, hugeAmount);

      await expect(
        collection.connect(minter).mintErc20(minter.address, hugeAmount)
      ).to.be.reverted;
    });

    it("should revert when paused", async function () {
      await collection.connect(creator).pause();

      await expect(
        collection.connect(minter).mintErc20(minter.address, USDC_AMOUNT)
      ).to.be.revertedWithCustomError(collection, "EnforcedPause");
    });
  });

  // ==========================================================================
  //                          FEE CALCULATION
  // ==========================================================================

  describe("Fee Calculation", function () {
    it("should work with percent-only fee", async function () {
      const amount = ethers.utils.parseEther("2"); // 2 ETH
      // 5% of 2 = 0.1 ETH
      const expectedFee = ethers.utils.parseEther("0.1");

      const feeRecipientBalBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );

      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      const feeRecipientBalAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );
      expect(feeRecipientBalAfter.sub(feeRecipientBalBefore)).to.equal(
        expectedFee
      );
    });

    it("should work with fixed-only fee (native)", async function () {
      const fixedFee = ethers.utils.parseEther("0.01");

      // Set fees: 0% bps, 0.01 ETH fixed
      await collection.connect(creator).setFees(0, fixedFee, 0);

      const amount = ethers.utils.parseEther("1");
      const feeRecipientBalBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );

      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      const feeRecipientBalAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );
      expect(feeRecipientBalAfter.sub(feeRecipientBalBefore)).to.equal(
        fixedFee
      );
    });

    it("should work with both percent and fixed fee", async function () {
      const fixedFee = ethers.utils.parseEther("0.01");

      // Set fees: 5% + 0.01 ETH fixed
      await collection.connect(creator).setFees(500, fixedFee, 0);

      const amount = ethers.utils.parseEther("1");
      const percentFee = amount.mul(500).div(10000); // 0.05 ETH
      const totalFee = percentFee.add(fixedFee); // 0.06 ETH

      const feeRecipientBalBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );

      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      const feeRecipientBalAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );
      expect(feeRecipientBalAfter.sub(feeRecipientBalBefore)).to.equal(
        totalFee
      );
    });

    it("should revert if fee exceeds amount", async function () {
      // Set a huge fixed fee
      const hugeFixedFee = ethers.utils.parseEther("10");
      await collection.connect(creator).setFees(500, hugeFixedFee, 0);

      const amount = ethers.utils.parseEther("1");

      await expect(
        collection
          .connect(minter)
          .mintNative(minter.address, amount, { value: amount })
      ).to.be.revertedWithCustomError(collection, "FeeExceedsAmount");
    });

    it("should handle zero fee (0% bps, 0 fixed)", async function () {
      await collection.connect(creator).setFees(0, 0, 0);

      const amount = ethers.utils.parseEther("1");
      const creatorBalBefore = await ethers.provider.getBalance(
        creator.address
      );

      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      const creatorBalAfter = await ethers.provider.getBalance(creator.address);
      // All payment goes to creator
      expect(creatorBalAfter.sub(creatorBalBefore)).to.equal(amount);
    });
  });

  // ==========================================================================
  //                          BURN
  // ==========================================================================

  describe("Burn", function () {
    beforeEach(async function () {
      const amount = ethers.utils.parseEther("1");
      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });
    });

    it("should burn by token owner", async function () {
      await collection.connect(minter).burn(0);

      await expect(collection.ownerOf(0)).to.be.revertedWithCustomError(
        collection,
        "ERC721NonexistentToken"
      );
    });

    it("should burn by approved operator", async function () {
      await collection.connect(minter).approve(other.address, 0);
      await collection.connect(other).burn(0);

      await expect(collection.ownerOf(0)).to.be.revertedWithCustomError(
        collection,
        "ERC721NonexistentToken"
      );
    });

    it("should revert if caller is not owner or approved", async function () {
      await expect(
        collection.connect(other).burn(0)
      ).to.be.revertedWithCustomError(
        collection,
        "ERC721InsufficientApproval"
      );
    });

    it("should not change totalSupply on burn (totalSupply = totalMinted)", async function () {
      // totalSupply returns _totalMinted which doesn't decrease on burn
      expect(await collection.totalSupply()).to.equal(1);
      await collection.connect(minter).burn(0);
      expect(await collection.totalSupply()).to.equal(1);
    });
  });

  // ==========================================================================
  //                          ROYALTIES
  // ==========================================================================

  describe("Royalties (ERC-2981)", function () {
    it("should return default royalty (10% to creator)", async function () {
      const [receiver, amount] = await collection.royaltyInfo(0, 10000);
      expect(receiver).to.equal(creator.address);
      expect(amount).to.equal(1000);
    });

    it("should update royalty by collection owner", async function () {
      await expect(collection.connect(creator).setRoyalty(other.address, 500))
        .to.emit(collection, "RoyaltyUpdated")
        .withArgs(other.address, 500);

      const [receiver, amount] = await collection.royaltyInfo(0, 10000);
      expect(receiver).to.equal(other.address);
      expect(amount).to.equal(500);
    });

    it("should update royalty by factory owner", async function () {
      await collection.connect(owner).setRoyalty(other.address, 200);

      const [receiver, amount] = await collection.royaltyInfo(0, 10000);
      expect(receiver).to.equal(other.address);
      expect(amount).to.equal(200);
    });

    it("should revert if bps > 10000", async function () {
      await expect(
        collection.connect(creator).setRoyalty(creator.address, 10001)
      ).to.be.revertedWithCustomError(collection, "InvalidRoyaltyBps");
    });

    it("should revert if called by unauthorized", async function () {
      await expect(
        collection.connect(other).setRoyalty(other.address, 500)
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");
    });
  });

  // ==========================================================================
  //                          METADATA
  // ==========================================================================

  describe("Metadata", function () {
    it("should return correct tokenURI as base64 JSON", async function () {
      const amount = ethers.utils.parseEther("1");
      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      const uri = await collection.tokenURI(0);
      expect(uri).to.match(/^data:application\/json;base64,/);

      // Decode base64
      const base64Part = uri.split(",")[1];
      const jsonStr = Buffer.from(base64Part, "base64").toString();
      const parsed = JSON.parse(jsonStr);

      expect(parsed.name).to.equal(collectionConfig.tokenMetaName);
      expect(parsed.description).to.equal(
        collectionConfig.tokenMetaDescription
      );
      expect(parsed.image).to.equal(collectionConfig.tokenMetaImage);
    });

    it("should return correct contractURI as base64 JSON", async function () {
      const uri = await collection.contractURI();
      expect(uri).to.match(/^data:application\/json;base64,/);

      const base64Part = uri.split(",")[1];
      const jsonStr = Buffer.from(base64Part, "base64").toString();
      const parsed = JSON.parse(jsonStr);

      expect(parsed.name).to.equal(collectionConfig.name);
      expect(parsed.description).to.equal(collectionConfig.description);
      expect(parsed.image).to.equal(collectionConfig.icon);
    });

    it("should revert tokenURI for non-existent token", async function () {
      await expect(collection.tokenURI(999)).to.be.revertedWithCustomError(
        collection,
        "ERC721NonexistentToken"
      );
    });

    it("should update collection metadata", async function () {
      await expect(
        collection
          .connect(creator)
          .setCollectionMetadata("New description", "https://new-icon.png")
      )
        .to.emit(collection, "CollectionMetadataUpdated")
        .withArgs("New description", "https://new-icon.png");

      expect(await collection.collectionDescription()).to.equal(
        "New description"
      );
      expect(await collection.collectionIcon()).to.equal(
        "https://new-icon.png"
      );
    });

    it("should update token metadata", async function () {
      await expect(
        collection
          .connect(creator)
          .setTokenMetadata("New Name", "New Desc", "https://new-img.png")
      )
        .to.emit(collection, "TokenMetadataUpdated")
        .withArgs("New Name", "New Desc", "https://new-img.png");

      expect(await collection.tokenMetaName()).to.equal("New Name");
      expect(await collection.tokenMetaDescription()).to.equal("New Desc");
      expect(await collection.tokenMetaImage()).to.equal(
        "https://new-img.png"
      );
    });

    it("should update metadata by factory owner", async function () {
      await collection
        .connect(owner)
        .setCollectionMetadata("Updated by factory", "icon2");
      expect(await collection.collectionDescription()).to.equal(
        "Updated by factory"
      );
    });

    it("should revert metadata update by unauthorized", async function () {
      await expect(
        collection
          .connect(other)
          .setCollectionMetadata("Hacked", "hacked-icon")
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");
    });
  });

  // ==========================================================================
  //                          ERC-20 TOKEN
  // ==========================================================================

  describe("ERC-20 Token", function () {
    it("should update ERC-20 token", async function () {
      const newToken = other.address; // just using an address
      await expect(collection.connect(creator).setErc20Token(newToken))
        .to.emit(collection, "Erc20TokenUpdated")
        .withArgs(newToken);

      expect(await collection.erc20Token()).to.equal(newToken);
    });

    it("should revert with zero address", async function () {
      await expect(
        collection
          .connect(creator)
          .setErc20Token(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(collection, "InvalidErc20Token");
    });

    it("should revert if called by unauthorized", async function () {
      await expect(
        collection.connect(other).setErc20Token(other.address)
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");
    });
  });

  // ==========================================================================
  //                          FEES MANAGEMENT
  // ==========================================================================

  describe("Fees Management", function () {
    it("should update fees by collection owner", async function () {
      await expect(collection.connect(creator).setFees(1000, 100, 50))
        .to.emit(collection, "FeesUpdated")
        .withArgs(1000, 100, 50);

      expect(await collection.feeBps()).to.equal(1000);
      expect(await collection.feeFixedNative()).to.equal(100);
      expect(await collection.feeFixedErc20()).to.equal(50);
    });

    it("should update fees by factory owner", async function () {
      await collection.connect(owner).setFees(200, 10, 5);

      expect(await collection.feeBps()).to.equal(200);
    });

    it("should revert fees update by unauthorized", async function () {
      await expect(
        collection.connect(other).setFees(1000, 100, 50)
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");
    });

    it("should revert if bps > 10000", async function () {
      await expect(
        collection.connect(creator).setFees(10001, 0, 0)
      ).to.be.revertedWithCustomError(collection, "InvalidRoyaltyBps");
    });
  });

  describe("Fee Recipient (protected)", function () {
    it("should update fee recipient by factory owner", async function () {
      await expect(
        collection.connect(owner).setFeeRecipient(other.address)
      )
        .to.emit(collection, "FeeRecipientUpdated")
        .withArgs(other.address);

      expect(await collection.feeRecipient()).to.equal(other.address);
    });

    it("should revert if collection owner tries to change fee recipient", async function () {
      await expect(
        collection.connect(creator).setFeeRecipient(creator.address)
      ).to.be.revertedWithCustomError(collection, "OnlyFactoryOwner");
    });

    it("should revert if random user tries to change fee recipient", async function () {
      await expect(
        collection.connect(other).setFeeRecipient(other.address)
      ).to.be.revertedWithCustomError(collection, "OnlyFactoryOwner");
    });

    it("should revert with zero address", async function () {
      await expect(
        collection
          .connect(owner)
          .setFeeRecipient(ethers.constants.AddressZero)
      ).to.be.revertedWithCustomError(collection, "InvalidFeeRecipient");
    });
  });

  // ==========================================================================
  //                          PAUSE / UNPAUSE
  // ==========================================================================

  describe("Pause / Unpause", function () {
    it("should pause by collection owner", async function () {
      await collection.connect(creator).pause();
      expect(await collection.paused()).to.be.true;
    });

    it("should unpause by collection owner", async function () {
      await collection.connect(creator).pause();
      await collection.connect(creator).unpause();
      expect(await collection.paused()).to.be.false;
    });

    it("should pause by factory owner", async function () {
      await collection.connect(owner).pause();
      expect(await collection.paused()).to.be.true;
    });

    it("should unpause by factory owner", async function () {
      await collection.connect(creator).pause();
      await collection.connect(owner).unpause();
      expect(await collection.paused()).to.be.false;
    });

    it("should revert pause by unauthorized", async function () {
      await expect(
        collection.connect(other).pause()
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");
    });

    it("should allow transfers when paused", async function () {
      const amount = ethers.utils.parseEther("1");
      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      await collection.connect(creator).pause();

      // Transfer should still work
      await collection
        .connect(minter)
        .transferFrom(minter.address, other.address, 0);
      expect(await collection.ownerOf(0)).to.equal(other.address);
    });

    it("should allow burn when paused", async function () {
      const amount = ethers.utils.parseEther("1");
      await collection
        .connect(minter)
        .mintNative(minter.address, amount, { value: amount });

      await collection.connect(creator).pause();

      await collection.connect(minter).burn(0);
      await expect(collection.ownerOf(0)).to.be.revertedWithCustomError(
        collection,
        "ERC721NonexistentToken"
      );
    });
  });

  // ==========================================================================
  //                          ACCESS CONTROL
  // ==========================================================================

  describe("Access Control", function () {
    it("should recognize new factory owner after ownership transfer", async function () {
      // Transfer factory ownership
      await factory.connect(owner).transferOwnership(other.address);

      // Old factory owner can no longer update
      await expect(
        collection.connect(owner).setFees(100, 0, 0)
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");

      // New factory owner can update
      await collection.connect(other).setFees(100, 0, 0);
      expect(await collection.feeBps()).to.equal(100);
    });

    it("should allow collection owner to transfer ownership", async function () {
      await collection.connect(creator).transferOwnership(other.address);
      expect(await collection.owner()).to.equal(other.address);

      // New owner can update
      await collection.connect(other).setFees(200, 0, 0);
      expect(await collection.feeBps()).to.equal(200);

      // Old owner cannot
      await expect(
        collection.connect(creator).setFees(300, 0, 0)
      ).to.be.revertedWithCustomError(collection, "UnauthorizedCaller");
    });
  });

  // ==========================================================================
  //                          ERC-165
  // ==========================================================================

  describe("ERC-165 Interface", function () {
    it("should support ERC-721", async function () {
      // ERC-721 interface ID = 0x80ac58cd
      expect(await collection.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("should support ERC-2981", async function () {
      // ERC-2981 interface ID = 0x2a55205a
      expect(await collection.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("should support ERC-165", async function () {
      // ERC-165 interface ID = 0x01ffc9a7
      expect(await collection.supportsInterface("0x01ffc9a7")).to.be.true;
    });
  });
});
