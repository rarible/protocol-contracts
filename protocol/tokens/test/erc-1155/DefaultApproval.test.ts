// <ai_context> TypeScript port of erc-1155/DefaultApproval.test.js. Tests default approval functionality for ERC1155. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";
const connection = await network.connect();
const { ethers } = connection;
import { type ERC1155DefaultApprovalTest, ERC1155DefaultApprovalTest__factory } from "../../types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

describe("ERC1155DefaultApproval", function () {
  let testing: ERC1155DefaultApprovalTest;
  let deployer: ethersTypes.Signer;
  let tokenOwner: ethersTypes.Signer;

  beforeEach(async () => {
    [deployer, , , , , tokenOwner] = await ethers.getSigners();
    const { instance } = await deployTransparentProxy<ERC1155DefaultApprovalTest>(ethers, {
      contractName: "ERC1155DefaultApprovalTest",
      initFunction: "__ERC1155DefaultApprovalTest_init",
      initArgs: ["uri"],
      proxyOwner: await deployer.getAddress(),
    });
    testing = instance;
  });

  it("should allow approved operator to transfer any token", async () => {
    const tokenId = 1n;
    const amount = 10n;
    const tokenOwnerAddress = await tokenOwner.getAddress();
    const deployerAddress = await deployer.getAddress();

    await testing.connect(deployer).mint(tokenOwnerAddress, tokenId, amount);

    await expect(
      testing.connect(deployer).safeTransferFrom(tokenOwnerAddress, deployerAddress, tokenId, amount, "0x")
    ).to.be.revertedWith("ERC1155: caller is not owner nor approved");

    await testing.connect(tokenOwner).setDefaultApproval(deployerAddress, true);

    await testing.connect(deployer).safeTransferFrom(tokenOwnerAddress, deployerAddress, tokenId, amount, "0x");

    expect(await testing.balanceOf(deployerAddress, tokenId)).to.equal(amount);
  });
});