const RariMineV3 = artifacts.require("RariMineV3.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');
const { signPersonalMessage } = require("../../scripts/sign.js");
const util = require('ethereumjs-util');

contract("RariMineV3", accounts => {
    let rariMine;
    let token;
    let staking;

    beforeEach(async () => {
        token = await ERC20.new();
        staking = await TestStaking.new();
        rariMine = await RariMineV3.new(token.address, accounts[0], staking.address);
        await staking.__Staking_init(token.address); //initialize, set owner
        await incrementBlock(WEEK); //to avoid stake() from ZERO point timeStamp
    })

    describe("Check claim()", () => {

        it("Should claim reward", async () => {
            const balances = [{
                "recipient": accounts[1].address,
                "value": 1000
            },
            {
                "recipient": accounts[2].address,
                "value": 1000
            },
            {
                "recipient": accounts[3].address,
                "value": 1000
            }
            ];
            const signedMessage = await web3.eth.sign(message, accounts[0]);
            const hash = await libSignature.getKeccak(balances);
            const signature = await signPersonalMessage(hash, accounts[0]);
            await rariMine.claim(signedMessage, signature.r, signature.s, signature.v);
            const sig2 = signature.r + signature.s.substr(2) + (signature.v + 4).toString(16)
        });

    })
})