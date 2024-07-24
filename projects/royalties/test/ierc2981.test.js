const Impl = artifacts.require("Royalties2981TestImpl.sol");
const Test = artifacts.require("Royalties2981Test.sol");

contract("royalties 2981 ", (accounts) => {
  let impl;
  let testing;

  beforeEach(async () => {
    impl = await Impl.new();
    /* 1000 base point = 10% */
    await impl.setRoyalties(1000);
    testing = await Test.new(impl.address);
  });

  it("simple impl works", async () => {
    const amount = 100;
    const getRoyalties = accounts[1];
    const tokenId = getRoyalties + "b00000000000000000000001";

    const result = await impl.royaltyInfo(tokenId, amount);

    const royaltiesBasePoint = await impl.royaltiesBasePoint();
    assert.equal(royaltiesBasePoint, 1000);
    assert.equal(result[0], getRoyalties);
    assert.equal(result[1], 10);

    const tx = await testing.royaltyInfoTest(tokenId, amount);
    console.log("used gas", tx.receipt.gasUsed);
  });

  it("calculateRoyalties check", async () => {
    const getterRoyalties = accounts[1];
    const result = await impl.calculateRoyaltiesTest.call(getterRoyalties, 150000);
    assert.equal(result.length, 1);
    assert.equal(result[0][0], getterRoyalties);
    assert.equal(result[0][1], 1500);
  });
});
