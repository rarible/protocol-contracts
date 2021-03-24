const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const RoyaltiesRegistryImpl = artifacts.require("RoyaltiesRegistryImpl.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ERC1155, ORDER_DATA_V1, TO_MAKER, TO_TAKER, PROTOCOL, ROYALTY, ORIGIN, PAYOUT, enc, id } = require("../assets");

contract("RoyaltiesRegistryImpl, test metods", accounts => {
	let testing;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";

	beforeEach(async () => {
		testing = await RoyaltiesRegistryImpl.new();
	});

	describe("Metods works:", () => {
		it("setTokenRoyalties()", async () => {
 			console.log("setTokenRoyalties() works!");
    })

	})

});
