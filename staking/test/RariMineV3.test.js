const RariMineV3 = artifacts.require("RariMineV3.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const TestStaking = artifacts.require("TestStaking.sol");
const LibSignatureTest = artifacts.require("LibSignatureTest.sol");
const LibEncoderTest = artifacts.require("LibEncoderTest.sol");

const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');
const { signPersonalMessage } = require("../../scripts/sign.js");
const Web3 = require('web3');

contract("RariMineV3", accounts => {
    let rariMine;
    let token;
    let staking;
    let rariMineOwner;
    let libSignature;
    let libEncoder;

    const DAY = 7200; // blocks in 1 day
	const WEEK = DAY * 7;

    beforeEach(async () => {
        token = await ERC20.new();
        staking = await TestStaking.new();
        rariMineOwner = accounts[0];
        libSignature = await LibSignatureTest.new();
        libEncoder = await LibEncoderTest.new();
        rariMine = await RariMineV3.new();
        await staking.__Staking_init(token.address); //initialize, set owner
        await staking.incrementBlock(WEEK);
        await rariMine.__RariMineV3_init(token.address, rariMineOwner, staking.address);
    })

    describe("Check claim()", () => {

        it("Should claim reward", async () => {
            await token.mint(accounts[0], 3000);
            const balances = [{
                "recipient": accounts[1],
                "value": 1000
            },
            {
                "recipient": accounts[2],
                "value": 1000
            },
            {
                "recipient": accounts[3],
                "value": 1000
            }
            ];
            await token.approve(rariMine.address, 3000);

            const encodedParameters = await libEncoder.encodeAbi(balances);
            console.log("encoded parameters",encodedParameters);
            const hash = await libSignature.getKeccak(encodedParameters);
            const signature = await signPersonalMessage(hash, accounts[0]);
            console.log('accounts[0]', accounts[0]);
            const ownerRari = await rariMine.owner();
            console.log('rariMine owner',ownerRari);

            console.log(balances, signature.r, signature.s, signature.v);
            await rariMine.claim(balances, signature.v, signature.r, signature.s);
            
        });

    })
})