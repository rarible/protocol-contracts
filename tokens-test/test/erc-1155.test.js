
const TestERC1155 = artifacts.require("TestERC1155.sol");

contract("erc-1155", accounts => {
	let erc1155Token;

	before(async () => {
		erc1155Token = await TestERC1155.new();
	});

	it("batch safeTransferFrom works", async () => {
		const minter = accounts[0];
    
    const ids = [1,2,3,4,5]
    const amounts = [10, 10, 10, 10, 10];
    const tos = [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]]
    const froms = [minter, minter, minter, minter, minter]

    for (let i = 0; i < ids.length; i ++){
      await erc1155Token.mint(minter, ids[i], amounts[i]);
    }

    await erc1155Token.batchSafeTransferFrom(froms, tos, ids, amounts)

    for (let i = 0; i < ids.length; i ++){
      assert.equal(await erc1155Token.balanceOf(tos[i], ids[i]), amounts[i])
    }
    
	})

});
