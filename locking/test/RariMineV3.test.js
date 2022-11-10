const RariMineV3 = artifacts.require("RariMineV3.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const TestLocking = artifacts.require("TestLocking.sol");
const LibSignatureTest = artifacts.require("LibSignatureTest.sol");
const LibEncoderTest = artifacts.require("LibEncoderTest.sol");
const keccak256 = require('keccak256')

// "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');
const { signPersonalMessage } = require("../../scripts/sign.js");
// const web3 = require('web3');

contract("RariMineV3", accounts => {
    let rariMine;
    let token;
    let locking;
    let libSignature;
    let libEncoder;
    let tokenOwner;
    let claimer1;
    let claimers;
    let version;
    let owner;
    let signer;
    let chainId;

    const DAY = 7200; // blocks in 1 day
	const WEEK = DAY * 7;

    beforeEach(async () => {
        claimer1 = accounts[5];
        claimer2 = accounts[6];
        claimer3 = accounts[7];
        claimers = [];
        tokenOwner = accounts[2];
        owner = accounts[0];
        signer = accounts[4];
        token = await ERC20.new();
        locking = await TestLocking.new();
        libSignature = await LibSignatureTest.new();
        libEncoder = await LibEncoderTest.new();
        
        await locking.__Locking_init(token.address, 0, 0, 0); //initialize, set owner
        await locking.incrementBlock(WEEK);

        rariMine = await RariMineV3.new();
        await rariMine.__RariMineV3_init(token.address, tokenOwner, locking.address, 4, 4, 4000);
        await rariMine.setSigner(signer);
        version = await rariMine.VERSION();
        chainId = await web3.eth.getChainId();
    })

    // return toString(keccak256(abi.encode(_balance, _address, id, VERSION)));
    function getPrepareMessage(balance, contractAddress, version, chainId) {
        const encodedParameters = web3.eth.abi.encodeParameters(
            [
                
                {
                    "ParentStruct": {
                        "recipient": 'uint256',
                        "value": 'uint256'
                    }
                },
                'uint256',
                'uint256',
                'uint256'
            ],
            [
                balance,
                contractAddress,
                version,
                chainId
            ]
        );

        const keccak256EncodedParameters = keccak256(encodedParameters).toString('hex');
        return keccak256EncodedParameters;
    }

    describe("Check claim()", () => {

        it("Should claim reward in proportion 40% is going to the claimer and 60% is going to the locking", async () => {
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

            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, version, chainId);
            console.log('prepareMessage', prepareMessage);

            const signature = await signPersonalMessage(prepareMessage, signer);

            const receipt = await rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 });
            truffleAssert.eventEmitted(receipt, 'Claim');
            truffleAssert.eventEmitted(receipt, 'Value');

            assert.equal(await token.balanceOf(locking.address), 600);
            assert.equal(await token.balanceOf(claimer1), 400);
        });

        it("Should claim reward in proportion 40% is going to the claimer and 60% is going to the locking - multiple users", async () => {
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
                const prepareMessage = getPrepareMessage(balanceClaimer, rariMine.address, version, chainId);
                const signature = await signPersonalMessage(prepareMessage, signer);

                const receipt = await rariMine.claim(balanceClaimer, signature.v, signature.r, signature.s, { from: balanceClaimer.recipient });
                console.log(`GasUsed in claim: ${receipt.receipt.gasUsed}`);

                const lockingBalance = await token.balanceOf(locking.address);
                assert.equal(await token.balanceOf(locking.address), 600 * (balanceClaimerIndex + 1));

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
            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, version, chainId);
            const signature = await signPersonalMessage(prepareMessage, signer);

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer2 }),
                "_msgSender() is not the receipient"
			);
		})

        it("claim reward a second time, expect revert: nothing to claim", async () => {

            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balances = [
                balanceClaimer1
            ];
            // mint tokens and approve to spent by rari mine
            await token.mint(tokenOwner, 10000);
            await token.approve(rariMine.address, 10000, { from: tokenOwner });
            
            // specify balances - increase by 1000
            await rariMine.doOverride(balances);

            balanceClaimer1.value = 2000;
            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, version, chainId);
            const signature = await signPersonalMessage(prepareMessage, signer);
            await rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 });

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 }),
                "nothing to claim" //todo: why another message: zero amount ?
			);
		})

        it("claim reward, expect revert: ERC20: transfer amount exceeds balance", async () => {

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
            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, version, chainId);
            const signature = await signPersonalMessage(prepareMessage, signer);

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 }),
                "ERC20: transfer amount exceeds balance"
			);
		})

        it("claim reward, expect revert: owner should sign a balance", async () => {

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
            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, version, chainId);
            const signature = await signPersonalMessage(prepareMessage, accounts[5]);

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 }),
                "signer should sign balances"
			);
		})

        it("claim rewardin case signature is not correct(incorrect message with wrong version of the contract) expect revert : signer should sign a balance", async () => {

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
            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, 0, chainId);
            const signature = await signPersonalMessage(prepareMessage, accounts[5]);

			await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 }),
                "signer should sign balances"
			);
		});

        it("Should claim reward in proportion 40% is going to the claimer and 60% is going to the locking - single user, receive reward 3 times", async () => {
            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balanceClaimer2 = {
                "recipient": claimer1,
                "value": 2000
            };
            const balanceClaimer3 = {
                "recipient": claimer1,
                "value": 3000
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
            for (let balanceClaimerIndex = 0; balanceClaimerIndex < balances.length; balanceClaimerIndex++) {
                let balanceClaimer = balances[balanceClaimerIndex];
                console.log('balanceClaimer, ', balanceClaimer);
                const prepareMessage = getPrepareMessage(balanceClaimer, rariMine.address, version, chainId);
                const signature = await signPersonalMessage(prepareMessage, signer);

                const receipt = await rariMine.claim(balanceClaimer, signature.v, signature.r, signature.s, { from: balanceClaimer.recipient });
                console.log(`GasUsed in claim: ${receipt.receipt.gasUsed}`);

                const lockingBalance = await token.balanceOf(locking.address);
                assert.equal(await token.balanceOf(locking.address), 600 * (balanceClaimerIndex + 1));

                const finalBalanceClaimer = await token.balanceOf(balanceClaimer.recipient);
                assert.equal(await token.balanceOf(balanceClaimer.recipient), 400* (balanceClaimerIndex + 1));
            }
            
            
        });

        it("Should claim all the reward ", async () => {

            rariMine = await RariMineV3.new();
            await rariMine.__RariMineV3_init(token.address, tokenOwner, locking.address, 4, 4, 10000);
            await rariMine.setSigner(signer);  
            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balanceClaimer2 = {
                "recipient": claimer1,
                "value": 2000
            };
            const balanceClaimer3 = {
                "recipient": claimer1,
                "value": 3000
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
            for (let balanceClaimerIndex = 0; balanceClaimerIndex < balances.length; balanceClaimerIndex++) {
                let balanceClaimer = balances[balanceClaimerIndex];
                console.log('balanceClaimer, ', balanceClaimer);
                const prepareMessage = getPrepareMessage(balanceClaimer, rariMine.address, version, chainId);
                const signature = await signPersonalMessage(prepareMessage, signer);

                const receipt = await rariMine.claim(balanceClaimer, signature.v, signature.r, signature.s, { from: balanceClaimer.recipient });
                console.log(`GasUsed in claim: ${receipt.receipt.gasUsed}`);

                assert.equal(await token.balanceOf(locking.address), 0 * (balanceClaimerIndex + 1));

                assert.equal(await token.balanceOf(balanceClaimer.recipient), 1000* (balanceClaimerIndex + 1));
            }
            
            
        });

        it("Should lock all the reward ", async () => {

            rariMine = await RariMineV3.new();
            await rariMine.__RariMineV3_init(token.address, tokenOwner, locking.address, 4, 4, 0);
            await rariMine.setSigner(signer); 
            const balanceClaimer1 = {
                "recipient": claimer1,
                "value": 1000
            };
            const balanceClaimer2 = {
                "recipient": claimer1,
                "value": 2000
            };
            const balanceClaimer3 = {
                "recipient": claimer1,
                "value": 3000
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
            for (let balanceClaimerIndex = 0; balanceClaimerIndex < balances.length; balanceClaimerIndex++) {
                let balanceClaimer = balances[balanceClaimerIndex];
                console.log('balanceClaimer, ', balanceClaimer);
                const prepareMessage = getPrepareMessage(balanceClaimer, rariMine.address, version, chainId);
                const signature = await signPersonalMessage(prepareMessage, signer);

                const receipt = await rariMine.claim(balanceClaimer, signature.v, signature.r, signature.s, { from: balanceClaimer.recipient });
                console.log(`GasUsed in claim: ${receipt.receipt.gasUsed}`);

                assert.equal(await token.balanceOf(locking.address), 1000 * (balanceClaimerIndex + 1));

                assert.equal(await token.balanceOf(balanceClaimer.recipient), 0* (balanceClaimerIndex + 1));
            }
            
            
        });
    });
    describe("Check signer", () => {

        it("only signer should sign the message", async () => {

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
            await rariMine.setSigner(signer);

            balanceClaimer1.value = 2000;

            const prepareMessage = getPrepareMessage(balanceClaimer1, rariMine.address, version, chainId);
            console.log('prepareMessage', prepareMessage);

            const signature = await signPersonalMessage(prepareMessage, owner);

            await truffleAssert.reverts(
				rariMine.claim(balanceClaimer1, signature.v, signature.r, signature.s, { from: claimer1 }),
                "signer should sign balances"
			);
        });
    })
})