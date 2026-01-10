const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Digitoys", function () {
  let digitoys;
  let items;
  let owner, signer, locker, user1, user2;

  beforeEach(async function () {
    [owner, signer, locker, user1, user2] = await ethers.getSigners();

    // Deploy DigitoysItems
    const DigitoysItems = await ethers.getContractFactory("DigitoysItems");
    items = await DigitoysItems.deploy();
    await items.waitForDeployment();
    await items.initialize(
      "Digitoys Items",
      "ITEMS",
      owner.address,
      "https://api.digitoys.io/items/"
    );

    // Deploy Digitoys
    const Digitoys = await ethers.getContractFactory("Digitoys");
    digitoys = await Digitoys.deploy();
    await digitoys.waitForDeployment();
    await digitoys.initialize(
      owner.address,
      signer.address,
      locker.address,
      await items.getAddress(),
      "https://api.digitoys.io/toys/"
    );

    // Grant MINTER_ROLE to Digitoys contract
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await items.grantRole(MINTER_ROLE, await digitoys.getAddress());

    // Set Digitoys contract in Items
    await items.setDigitoysContract(await digitoys.getAddress());
  });

  describe("Token Basics", function () {
    it("should have correct name and symbol", async function () {
      expect(await digitoys.name()).to.equal("Digitoys");
      expect(await digitoys.symbol()).to.equal("TOYS");
    });

    it("should mint tokens", async function () {
      await digitoys.mintToy(user1.address, false);
      expect(await digitoys.ownerOf(0)).to.equal(user1.address);
      expect(await digitoys.balanceOf(user1.address)).to.equal(1n);
    });

    it("should mint locked tokens", async function () {
      await digitoys.mintToy(user1.address, true);
      expect(await digitoys.isLocked(0)).to.equal(true);
    });

    it("should mint with specific ID", async function () {
      await digitoys.mintToyWithId(user1.address, 100, false);
      expect(await digitoys.ownerOf(100)).to.equal(user1.address);
    });
  });

  describe("Lock/Unlock Functionality", function () {
    beforeEach(async function () {
      await digitoys.mintToy(user1.address, false);
    });

    it("should lock a token", async function () {
      await digitoys.connect(locker).lock(0);
      expect(await digitoys.isLocked(0)).to.equal(true);
    });

    it("should unlock a token", async function () {
      await digitoys.connect(locker).lock(0);
      await digitoys.connect(locker).unlock(0);
      expect(await digitoys.isLocked(0)).to.equal(false);
    });

    it("token owner can lock their token", async function () {
      await digitoys.connect(user1).lock(0);
      expect(await digitoys.isLocked(0)).to.equal(true);
    });

    it("token owner can unlock their token", async function () {
      await digitoys.connect(user1).lock(0);
      await digitoys.connect(user1).unlock(0);
      expect(await digitoys.isLocked(0)).to.equal(false);
    });

    it("contract owner can lock any token", async function () {
      await digitoys.connect(owner).lock(0);
      expect(await digitoys.isLocked(0)).to.equal(true);
    });

    it("should emit Locked event", async function () {
      await expect(digitoys.connect(locker).lock(0))
        .to.emit(digitoys, "Locked")
        .withArgs(0);
    });

    it("should emit Unlocked event", async function () {
      await digitoys.connect(locker).lock(0);
      await expect(digitoys.connect(locker).unlock(0))
        .to.emit(digitoys, "Unlocked")
        .withArgs(0);
    });

    it("should prevent transfer of locked tokens", async function () {
      await digitoys.connect(locker).lock(0);

      await expect(
        digitoys.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWithCustomError(digitoys, "TokenLocked");
    });

    it("should allow transfer after unlock", async function () {
      await digitoys.connect(locker).lock(0);
      await digitoys.connect(locker).unlock(0);
      await digitoys.connect(user1).transferFrom(user1.address, user2.address, 0);
      expect(await digitoys.ownerOf(0)).to.equal(user2.address);
    });

    it("should prevent unauthorized lock", async function () {
      await expect(
        digitoys.connect(user2).lock(0)
      ).to.be.revertedWithCustomError(digitoys, "NotAuthorizedToLock");
    });

    it("should prevent locking already locked token", async function () {
      await digitoys.connect(locker).lock(0);

      await expect(
        digitoys.connect(locker).lock(0)
      ).to.be.revertedWithCustomError(digitoys, "TokenAlreadyInState");
    });

    it("should prevent unlocking already unlocked token", async function () {
      await expect(
        digitoys.connect(locker).unlock(0)
      ).to.be.revertedWithCustomError(digitoys, "TokenAlreadyInState");
    });
  });

  describe("Locker Management", function () {
    it("should return locker address", async function () {
      expect(await digitoys.locker()).to.equal(locker.address);
    });

    it("owner can update locker", async function () {
      await digitoys.setLocker(user2.address);
      expect(await digitoys.locker()).to.equal(user2.address);
    });

    it("should emit LockerUpdated event", async function () {
      await expect(digitoys.setLocker(user2.address))
        .to.emit(digitoys, "LockerUpdated")
        .withArgs(locker.address, user2.address);
    });

    it("non-owner cannot update locker", async function () {
      await expect(
        digitoys.connect(user1).setLocker(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Signer Management", function () {
    it("should return signer address", async function () {
      expect(await digitoys.signer()).to.equal(signer.address);
    });

    it("owner can update signer", async function () {
      await digitoys.setSigner(user2.address);
      expect(await digitoys.signer()).to.equal(user2.address);
    });

    it("should emit SignerUpdated event", async function () {
      await expect(digitoys.setSigner(user2.address))
        .to.emit(digitoys, "SignerUpdated")
        .withArgs(signer.address, user2.address);
    });

    it("should prevent zero address signer", async function () {
      await expect(
        digitoys.setSigner(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(digitoys, "ZeroAddress");
    });
  });

  describe("DigitoysItems", function () {
    it("should have correct name and symbol", async function () {
      expect(await items.name()).to.equal("Digitoys Items");
      expect(await items.symbol()).to.equal("ITEMS");
    });

    it("should mint items with correct item type", async function () {
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      await items.grantRole(MINTER_ROLE, owner.address);

      await items.mint(user1.address, 1);
      expect(await items.ownerOf(0)).to.equal(user1.address);
      expect(await items.itemType(0)).to.equal(1n);
    });

    it("should mint items with specific ID", async function () {
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      await items.grantRole(MINTER_ROLE, owner.address);

      await items.mintWithId(user1.address, 100, 2);
      expect(await items.ownerOf(100)).to.equal(user1.address);
      expect(await items.itemType(100)).to.equal(2n);
    });
  });

  describe("Equip/Unequip", function () {
    beforeEach(async function () {
      await digitoys.mintToy(user1.address, false);
    });

    it("should track equipped items count", async function () {
      expect(await digitoys.equippedItemsCount(0)).to.equal(0n);
    });

    it("should return empty equipped items array", async function () {
      const equipped = await digitoys.equippedItems(0);
      expect(equipped.length).to.equal(0);
    });

    it("should return false for isEquipped on non-equipped item", async function () {
      expect(await digitoys.isEquipped(0, 999)).to.equal(false);
    });
  });

  describe("Integration", function () {
    it("should handle minting locked token with items contract set", async function () {
      await digitoys.mintToy(user1.address, true);
      expect(await digitoys.isLocked(0)).to.equal(true);
      expect(await digitoys.ownerOf(0)).to.equal(user1.address);
    });

    it("should update items contract", async function () {
      const DigitoysItems = await ethers.getContractFactory("DigitoysItems");
      const newItems = await DigitoysItems.deploy();
      await newItems.waitForDeployment();
      await newItems.initialize("New Items", "NITEMS", owner.address, "https://new.api/");

      await digitoys.setItemsContract(await newItems.getAddress());
      expect(await digitoys.items()).to.equal(await newItems.getAddress());
    });

    it("should emit ItemsContractUpdated event", async function () {
      const DigitoysItems = await ethers.getContractFactory("DigitoysItems");
      const newItems = await DigitoysItems.deploy();
      await newItems.waitForDeployment();
      await newItems.initialize("New Items", "NITEMS", owner.address, "https://new.api/");

      await expect(digitoys.setItemsContract(await newItems.getAddress()))
        .to.emit(digitoys, "ItemsContractUpdated")
        .withArgs(await items.getAddress(), await newItems.getAddress());
    });
  });

  describe("Base URI", function () {
    it("should emit BaseURIUpdated event", async function () {
      await expect(digitoys.setBaseURI("https://new.api.digitoys.io/"))
        .to.emit(digitoys, "BaseURIUpdated")
        .withArgs("https://new.api.digitoys.io/");
    });
  });

  describe("EIP712 Domain", function () {
    it("should return domain separator", async function () {
      const domainSeparator = await digitoys.domainSeparator();
      expect(domainSeparator).to.not.be.undefined;
      expect(domainSeparator.length).to.equal(66); // 0x + 64 hex chars
    });
  });
});
