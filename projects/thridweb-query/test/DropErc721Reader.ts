import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomicfoundation/hardhat-toolbox";
import { network } from "hardhat"

import {DropERC721Reader, DropERC721Reader__factory, Initializable} from "../typechain-types";
import {DropERC721, DropERC721__factory} from "../typechain-types";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ClaimEligibility, ThirdwebSDK} from "@thirdweb-dev/sdk";
import {ThirdwebStorage} from "@thirdweb-dev/storage";
import {getClaimIneligibilityReasons} from "../utils/get-claim-illegebility";
import { assert } from "console";

const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("Test Erc721 Reader", function () {
  let erc721Reader: DropERC721Reader;
  let owner: SignerWithAddress;
  let sdk: ThirdwebSDK;
  let storage: ThirdwebStorage

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    erc721Reader = await DropERC721Reader__factory.connect("0x29433D84cCb7241097Df27E30f36fe7433B19232", owner)
    console.log(erc721Reader.address)
    sdk = ThirdwebSDK.fromSigner(
         owner, // Your wallet's private key (only required for write operations)
        "polygon",
        {
          clientId: process.env.THIRDWEB_CLIENT_ID, // Use client id if using on the client side, get it from dashboard settings
          secretKey: process.env.THIRDWEB_SECRET, // Use secret key if using on the server, get it from dashboard settings
        },
    );
    storage = new ThirdwebStorage({
      clientId: process.env.THIRDWEB_CLIENT_ID, // Use client id if using on the client side, get it from dashboard settings
      secretKey: process.env.THIRDWEB_SECRET, // Use secret key if using on the server, get it from dashboard settings
    });

  });

  describe("reader test", function () {

    // NoWallet = "No wallet connected.",
    it("There is no claim condition set.", async function () {
      const collectionAddress = "0x0Fe7B48225f2c7E24952747F5D644Ba9937a199E"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, undefined)
      expect(claimReason).to.eq(ClaimEligibility.NoWallet)
    });

    it("There is no claim condition set.", async function () {
      const collectionAddress = "0x0Fe7B48225f2c7E24952747F5D644Ba9937a199E"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.NoClaimConditionSet)
    });
    
    it("This address is not on the allowlist.", async function () {
      const collectionAddress = "0xA00412829A4fFB09b5a85042941f8EC4B2F385cA"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.AddressNotAllowed)
    });


    // WaitBeforeNextClaimTransaction = "Not enough time since last claim transaction. Please wait.",
    // AlreadyClaimed = "You have already claimed the token.",
    // WrongPriceOrCurrency = "Incorrect price or currency.",
    // NoActiveClaimPhase = "There is no active claim phase at the moment. Please check back in later.",
    // Unknown = "No claim conditions found."

    it("Claim phase has not started yet.", async function () {
      const collectionAddress = "0xe114A562C3F994859fd9077A804A3E5084D62FeF"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.ClaimPhaseNotStarted, "Claim phase has not started yet.")
    });

    it("Cannot claim more than maximum allowed quantity.", async function () {
      const collectionAddress = "0x19cFE5f37024B2f4E48Ee090897548A48C88237C"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 4, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.OverMaxClaimablePerWallet, "Cannot claim more than maximum allowed quantity.")
    });

    // NotEnoughSupply = "There is not enough supply to claim.",
    it("There is not enough supply to claim.", async function () {
      const collectionAddress = "0x0645336C3C2A892926b18e5B85aA009805C377d8"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 4, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.NotEnoughSupply, "There is not enough supply to claim.")
    });

    // OverMaxClaimablePerWallet = "Cannot claim more than maximum allowed quantity.",
    it("Cannot claim more than maximum allowed quantity.", async function () {
      const collectionAddress = "0x8e0d557d99B4AB7a066327a819c579D0CfdCe3E1"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 10, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.OverMaxClaimablePerWallet, "Cannot claim more than maximum allowed quantity.")
    });

    // NotEnoughTokens = "There are not enough tokens in the wallet to pay for the claim.",
    it("There are not enough tokens in the wallet to pay for the claim.", async function () {
      const collectionAddress = "0x5fafecB2E623b84d5EE824e82d35a18DFe6B0f20"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, owner.address)
      expect(claimReason).to.eq(ClaimEligibility.NotEnoughTokens, "There are not enough tokens in the wallet to pay for the claim.")
    });

    it("can claim public", async function () {
      const collectionAddress = "0x8e0d557d99B4AB7a066327a819c579D0CfdCe3E1"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, owner.address)
      expect(claimReason).to.eq(null, "Claim reason should be null for a public mint")
    });

    it("can claim private", async function () {
      const collectionAddress = "0x19cFE5f37024B2f4E48Ee090897548A48C88237C"
      const erc721Drop = DropERC721__factory.connect(collectionAddress, owner)
      const claimReason = await getClaimIneligibilityReasons(erc721Reader, erc721Drop, 1, storage, sdk, owner.address)
      expect(claimReason).to.eq(null, "Claim illegebility reason should be null for a private mint")
    });
    
  });

  // https://polygonscan.com/block/51404403
  // 
  describe("reader test", function () {
    it("can query datas.", async function () {
      const value = ethers.utils.parseEther("0.003")
      const allData = await erc721Reader.getAllData("0x7180b24b73495968acd96f700f0860599a75dc9e", "0x02D0F78EFf8Eb9Fb49933776a06BA3dD4b0CfBe1")
      console.log(JSON.stringify(allData))
    });
  })
});
