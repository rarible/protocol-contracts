const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");

contract("ownable tokens", accounts => {
  
	it("erc721 should be ownable ", async () => {
    const owner = accounts[4]
		const testing = await TestERC721.new("", "", {from: owner});
    assert.equal(await testing.owner(), owner, "owner after creation")

    const newOwner = accounts[5]
    await testing.transferOwnership(newOwner, {from: owner});
    assert.equal(await testing.owner(), newOwner, "owner after transferOwnership")
	})

  it("erc1155 should be ownable ", async () => {
    const owner = accounts[4]
		const testing = await TestERC1155.new("", {from: owner});
    assert.equal(await testing.owner(), owner, "owner after creation")

    const newOwner = accounts[5]
    await testing.transferOwnership(newOwner, {from: owner});
    assert.equal(await testing.owner(), newOwner, "owner after transferOwnership")
	})

})