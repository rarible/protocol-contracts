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
    let libSignature;
    let libEncoder;
    let tokenOwner;
    let claimer1;
    let claimers;
    let version;
    let owner;

    const DAY = 7200; // blocks in 1 day
	const WEEK = DAY * 7;

    beforeEach(async () => {
        claimer1 = accounts[5];
        claimer2 = accounts[6];
        claimer3 = accounts[7];
        claimers = [];
        tokenOwner = accounts[2];
        owner = accounts[0];
        token = await ERC20.new();
        staking = await TestStaking.new();
        libSignature = await LibSignatureTest.new();
        libEncoder = await LibEncoderTest.new();
        rariMine = await RariMineV3.new();
        await staking.__Staking_init(token.address, 0, 0, 0); //initialize, set owner
        await staking.incrementBlock(WEEK);
        await rariMine.__RariMineV3_init(token.address, tokenOwner, staking.address);
        version = await rariMine.VERSION();
    })

    describe("Check claim()", () => {

        it("Should claim reward in proportion 40% is going to the claimer and 60% is going to the staking", async () => {
            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balances = [
                balanceClaimer1
            ];
            // mint tokens and approve to spent by rari mine
            await token.mint(tokenOwner, 1000);
            await token.approve(rariMine.address, 1000, { from: tokenOwner });
            
            // specify balances - increase by 1000
            await rariMine.doOverride(balances);

            balanceClaimer1.value = 2000;
            const prepareMessage = await libEncoder.prepareMessage(balanceClaimer1, rariMine.address, version);
            const signature = await signPersonalMessage(prepareMessage, owner);

            const receipt = await rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 });
            truffleAssert.eventEmitted(receipt, 'Claim');
            truffleAssert.eventEmitted(receipt, 'Value');

            assert.equal(await token.balanceOf(staking.address), 600);
            assert.equal(await token.balanceOf(claimer1), 400);
        });

        it("Should claim reward in proportion 40% is going to the claimer and 60% is going to the staking - multiple users", async () => {
            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 0
            };
            const balanceClaimer2 = {
                "recipient": claimer2,
                "value": 0
            };
            const balanceClaimer3 = {
                "recipient": claimer3,
                "value": 0
            };
            const balances = [
                balanceClaimer1,
                balanceClaimer2,
                balanceClaimer3
            ];
            // mint tokens and approve to spent by rari mine
            await token.mint(tokenOwner, 3000);
            await token.approve(rariMine.address, 3000, { from: tokenOwner });
            
            // specify balances - increase by 1000
            await rariMine.doOverride(balances);
            for (let balanceClaimerIndex = 0; balanceClaimerIndex < balances.length; balanceClaimerIndex++) {
                let balanceClaimer = balances[balanceClaimerIndex];
                balanceClaimer.value = 1000;
                const prepareMessage = await libEncoder.prepareMessage(balanceClaimer, rariMine.address, version);
                const signature = await signPersonalMessage(prepareMessage, owner);

                const receipt = await rariMine.claim(balanceClaimer, signature.v, signature.r, signature.s, { from: balanceClaimer.recipient });
                console.log(`GasUsed in claim: ${receipt.receipt.gasUsed}`);

                const stakingBalance = await token.balanceOf(staking.address);
                assert.equal(await token.balanceOf(staking.address), 600 * (balanceClaimerIndex + 1));

                const finalBalanceClaimer = await token.balanceOf(balanceClaimer.recipient);
                assert.equal(await token.balanceOf(balanceClaimer.recipient), 400);
            }
            
            
        });

        it("claim reward, expect revert on incorrect claimer", async () => {

            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balances = [
                balanceClaimer1
            ];
            // mint tokens and approve to spent by rari mine
            await token.mint(tokenOwner, 1000);
            await token.approve(rariMine.address, 1000, { from: tokenOwner });
            
            // specify balances - increase by 1000
            await rariMine.doOverride(balances);

            balanceClaimer1.value = 2000;
            const prepareMessage = await libEncoder.prepareMessage(balanceClaimer1, rariMine.address, version);
            const signature = await signPersonalMessage(prepareMessage, owner);

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer2 }),
                "_msgSender() is not the receipient"
			);
		})

        it("claim reward, expect revert on isufficient balance", async () => {

            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balances = [
                balanceClaimer1
            ];
            // mint tokens and approve to spent by rari mine
            await token.mint(tokenOwner, 1000);
            await token.approve(rariMine.address, 1000, { from: tokenOwner });
            
            // specify balances - increase by 1000
            await rariMine.doOverride(balances);

            balanceClaimer1.value = 3000;
            const prepareMessage = await libEncoder.prepareMessage(balanceClaimer1, rariMine.address, version);
            const signature = await signPersonalMessage(prepareMessage, owner);

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 }),
                "ERC20: transfer amount exceeds balance"
			);
		})
    });
    
})