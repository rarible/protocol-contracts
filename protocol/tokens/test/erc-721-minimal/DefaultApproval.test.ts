import { expect } from "chai";
import { network } from "hardhat";
import type * as ethersTypes from "ethers";

const connection = await network.connect();
const { ethers } = connection;

import { type ERC721DefaultApprovalTest, ERC721DefaultApprovalTest__factory } from "../../types/ethers-contracts";
import { deployTransparentProxy } from "@rarible/common-sdk/src/deploy";

describe("ERC721DefaultApproval", function () {
	let testing: ERC721DefaultApprovalTest;
	let tokenOwner: ethersTypes.Signer;
	let deployer: ethersTypes.Signer;

	beforeEach(async () => {
	 [deployer, tokenOwner] = await ethers.getSigners();
		const { instance } = await deployTransparentProxy<ERC721DefaultApprovalTest>(ethers, {
			contractName: "ERC721DefaultApprovalTest",
			initFunction: "__ERC721DefaultApprovalTest_init",
			initArgs: [await deployer.getAddress(), await deployer.getAddress()],
			proxyOwner: await deployer.getAddress(),
		});
		testing = instance;
	})

	it("should allow approved operator to transfer any token", async () => {
		const tokenId = 1;
		await testing.mint(await tokenOwner.getAddress(), tokenId);
		await expect(testing.transferFrom(await tokenOwner.getAddress(), await deployer.getAddress(), tokenId)).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
		await testing.connect(tokenOwner).setDefaultApproval(await deployer.getAddress(), true);
		await testing.connect(tokenOwner).transferFrom(await tokenOwner.getAddress(), await deployer.getAddress(), tokenId);
		expect(await testing.ownerOf(1)).to.equal(await deployer.getAddress());
	})
})