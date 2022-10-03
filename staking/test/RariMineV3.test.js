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
    let tokenOwner;

    const DAY = 7200; // blocks in 1 day
	const WEEK = DAY * 7;

    beforeEach(async () => {
        tokenOwner = accounts[2];
        token = await ERC20.new();
        staking = await TestStaking.new();
        libSignature = await LibSignatureTest.new();
        libEncoder = await LibEncoderTest.new();
        rariMine = await RariMineV3.new();
        console.log("token.address", token.address);
        await staking.__Staking_init(token.address); //initialize, set owner
        await staking.incrementBlock(WEEK);
        await rariMine.__RariMineV3_init(token.address, tokenOwner, staking.address);
    })

    describe("Check claim()", () => {

        it("Should claim reward", async () => {
            const balance0 = {
                "recipient": accounts[1],
                "value": 1000
            };
            const balance1 = {
                "recipient": accounts[2],
                "value": 1000
            };
            const balance2 = {
                "recipient": accounts[3],
                "value": 1000
            };
            const balances = [
                balance0, 
                balance1,
                balance2
            ];
            await token.mint(tokenOwner, 4500);
            await token.approve(rariMine.address, 1000000, { from: tokenOwner });

            await rariMine.doOverride(balances);

            const chainId = await web3.eth.getChainId();
            balance0.value = 2000;
            const encodedParameters = await libEncoder.encodeAbi(balance0, rariMine.address);
            console.log("encoded parameters",encodedParameters);
            const hash = await libEncoder.getKeccak256(encodedParameters);
            console.log("hash", hash.toString());

            const prepareMessage = await libEncoder.prepareMessage(balance0, rariMine.address);
            console.log("prepareHash", prepareMessage);


            const strHash = await libSignature.toString(hash);
            console.log("strHash", strHash.toString());
            // TODO: hash to strings with contract function(hex representation)
            const signature = await signPersonalMessage(prepareMessage, accounts[0]);
            console.log('accounts[0]', accounts[0]);
            const ownerRari = await rariMine.owner();
            console.log('rariMine owner', ownerRari);

            console.log(balances, signature.r, signature.s, signature.v);
            await rariMine.claim(balance0, signature.v, signature.r, signature.s, { from: accounts[1] });
            
        });

    })
})