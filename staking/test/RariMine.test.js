const RariMine = artifacts.require("RariMine.sol");
const Staking = artifacts.require("Staking.sol");
const ERC20 = artifacts.require("TestERC20.sol");
const truffleAssert = require('truffle-assertions');
const tests = require("@daonomic/tests-common");
const increaseTime = tests.increaseTime;
const { expectThrow } = require("@daonomic/tests-common");

contract("RariMine", accounts => {
  let staking;
  let testStaking;
  let token;
  let deposite;

  const DAY = 86400;
  const WEEK = DAY * 7;
  const MONTH = WEEK * 4;
  const YEAR = DAY * 365;
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    deposite = accounts[1];
    tokenOwner = accounts[2];
    token = await ERC20.new();
    staking = await Staking.new();
    await staking.__Staking_init(token.address); //initialize staking, set token
    rariMine = await RariMine.new(token.address, tokenOwner, staking.address); //initialize rariMine
  })

  describe("Check RariMine claim", () => {

    it("Test 1.1 Claim() and stake tokens", async () => {
      await token.mint(tokenOwner, 1500);
      await token.approve(rariMine.address, 1000000, { from: tokenOwner });
      const recipient = accounts[3];
      const amount = 100;
      let balanceRecipient = {recipient: recipient, value: amount};
      await rariMine.plus([balanceRecipient]);
      await rariMine.setSlopePeriod(10);
      await rariMine.setCliffPeriod(10);
      await rariMine.claim({from: recipient});

      let balanceOf = await staking.balanceOf.call(recipient);
      assert.equal(balanceOf, 0x1f);
      assert.equal(await token.balanceOf(staking.address), 100);
      assert.equal(await token.balanceOf(rariMine.address), 0);
      assert.equal(await token.balanceOf(tokenOwner), 1400);
    });

    it("Test 1.2 Claim() and stake tokens, emit event", async () => {
      await token.mint(tokenOwner, 1500);
      await token.approve(rariMine.address, 1000000, { from: tokenOwner });
      const recipient = accounts[3];
      const amount = 100;
      const slopePeriod = 10;
      const cliffPeriod = 10;
      let balanceRecipient = {recipient: recipient, value: amount};
      await rariMine.plus([balanceRecipient]);

      const txSetSlopePeriod = await rariMine.setSlopePeriod(slopePeriod);
      const txSetCliffPeriod = await rariMine.setCliffPeriod(cliffPeriod);
      let txSlopePeriod;
      let txCliffPeriod;

      truffleAssert.eventEmitted(txSetSlopePeriod, 'SlopePeriodChange', (ev) => {
        txSlopePeriod = ev.newSlopePeriod;
        return true;
      });
      assert.equal(txSlopePeriod, slopePeriod, "SlopePeriodChange event incorrect");

      truffleAssert.eventEmitted(txSetCliffPeriod, 'CliffPeriodChange', (ev) => {
        txCliffPeriod = ev.newCliffPeriod;
        return true;
      });
      assert.equal(txCliffPeriod, cliffPeriod, "CliffPeriodChange event incorrect");

      const txClaim = await rariMine.claim({from: recipient});
      let txTokenOwner;
      let txBalance;
      truffleAssert.eventEmitted(txClaim, 'BalanceChange', (ev) => {
        txTokenOwner = ev.owner;
        txBalance = ev.balance;
        return true;
      });
      assert.equal(txTokenOwner, recipient, "BalanceChange event incorrect");
      assert.equal(txBalance, 0, "BalanceChange event incorrect");
    });

    it("Test 2.1 Claim() and transfer tokens to recipient", async () => {
    	await token.mint(tokenOwner, 1500);
     	await token.approve(rariMine.address, 1000000, { from: tokenOwner });
      const recipient = accounts[3];
      const amount = 100;
      let balanceRecipient = {recipient: recipient, value: amount};
      await rariMine.plus([balanceRecipient]);
      await rariMine.claim({from: recipient});

      let balanceOf = await staking.balanceOf.call(recipient);
      assert.equal(balanceOf, 0x0);
      assert.equal(await token.balanceOf(recipient), 100);
      assert.equal(await token.balanceOf(staking.address), 0);
      assert.equal(await token.balanceOf(rariMine.address), 0);
      assert.equal(await token.balanceOf(tokenOwner), 1400);
    });

    it("Test 2.2 Claim() and transfer tokens to recipient emit event", async () => {
      await token.mint(tokenOwner, 1500);
      await token.approve(rariMine.address, 1000000, { from: tokenOwner });
      const recipient = accounts[3];
      const amount = 100;
      let balanceRecipient = {recipient: recipient, value: amount};
      await rariMine.plus([balanceRecipient]);
      const txClaim = await rariMine.claim({from: recipient});
      let txTokenOwner;
      let txBalance;
      truffleAssert.eventEmitted(txClaim, 'BalanceChange', (ev) => {
        txTokenOwner = ev.owner;
        txBalance = ev.balance;
        return true;
      });
      assert.equal(txTokenOwner, recipient, "BalanceChange event incorrect");
      assert.equal(txBalance, 0, "BalanceChange event incorrect");
    });

    it("Test 3. throw", async () => {
      await token.mint(tokenOwner, 1500);
      await token.approve(rariMine.address, 1000000, { from: tokenOwner });

      let balanceRecipient = {recipient: zeroAddress, value: 100};
      await expectThrow( // throw zero recipient = zero address
        rariMine.plus([balanceRecipient])
      );
      const recipient = accounts[3];
      balanceRecipient = {recipient: recipient, value: 0};
      await expectThrow( // throw zero recipient = zero amount
        rariMine.plus([balanceRecipient])
      );

      balanceRecipient = {recipient: zeroAddress, value: 100};
      await expectThrow( // throw zero recipient = zero address
        rariMine.minus([balanceRecipient])
      );

      balanceRecipient = {recipient: recipient, value: 0};
      await expectThrow( // throw zero recipient = zero amount
        rariMine.minus([balanceRecipient])
      );
    });

  })

})