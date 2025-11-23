// <ai_context> Test suite for ERC1155 contract behavior, focusing on batch transfers. </ai_context>
import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.connect();

describe("erc-1155", function () {
  let erc1155Token;
  before(async function () {
    const TestERC1155 = await ethers.getContractFactory("TestERC1155");
    erc1155Token = await TestERC1155.deploy();
    await erc1155Token.waitForDeployment();
  });

  it("batch safeTransferFrom works", async function () {
    const [minter, ...recipients] = await ethers.getSigners();
    const ids = [1n, 2n, 3n, 4n, 5n];
    const amounts = [10n, 10n, 10n, 10n, 10n];
    const tos = recipients.slice(0, 5).map(s => s.address);
    const froms = Array(5).fill(minter.address);

    for (let i = 0; i < ids.length; i++) {
      await erc1155Token.connect(minter).mint(minter.address, ids[i], amounts[i]);
    }

    await erc1155Token.connect(minter).batchSafeTransferFrom(froms, tos, ids, amounts);

    for (let i = 0; i < ids.length; i++) {
      expect(await erc1155Token.balanceOf(tos[i], ids[i])).to.equal(amounts[i]);
    }
  });
});