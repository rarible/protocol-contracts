const RariMineV3 = artifacts.require("RariMineV3.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');
contract("RariMineV3", accounts => {
    let rariMine;
    let token;

    beforeEach(async () => {
        token = await ERC20.new();
        rariMine = await RariMineV3.new(token.address, accounts[0]);
    })

    describe("Check claim()", () => {

        it("Should claim reward", async () => {

        });

    })
})