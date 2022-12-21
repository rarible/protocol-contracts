const OrderValidatorTest = artifacts.require("OrderValidatorTest.sol");
const TestERC1271 = artifacts.require("TestERC1271.sol");
const order = require("../../scripts/order.js");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow } = require("@daonomic/tests-common");

contract("OrderValidator", accounts => {
  let testing;
  let erc1271;

  before(async () => {
    testing = await OrderValidatorTest.new();
    await testing.__OrderValidatorTest_init();
    erc1271 = await TestERC1271.new();
  });

  it("Test1. should validate if signer is correct", async () => {
    const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const signature = await getSignature(testOrder, accounts[1], testing.address);
    const tx = await testing.validateOrderTest2(testOrder, signature);
    console.log(tx.receipt.gasUsed)
  });

  it("Test2. should fail validate if signer is incorrect", async () => {
    const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const signature = await getSignature(testOrder, accounts[2], testing.address);
    await expectThrow(
      testing.validateOrderTest(testOrder, signature)
    );
  });

  it("Test3. should bypass signature if maker is msg.sender", async () => {
    const testOrder = order.Order(accounts[5], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    await testing.validateOrderTest(testOrder, "0x", { from: accounts[5] });
  });

  it("Test4. should validate if signer is contract and 1271 passes", async () => {
    const testOrder = order.Order(erc1271.address, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const signature = await getSignature(testOrder, accounts[2], testing.address);

    await expectThrow(
      testing.validateOrderTest(testOrder, signature)
    );

    await erc1271.setReturnSuccessfulValidSignature(true);

    await testing.validateOrderTest(testOrder, signature);
  });

  it("Test5. should not validate contract don`t support ERC1271_INTERFACE", async () => {
    const testOrder = order.Order(testing.address, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    const signature = await getSignature(testOrder, accounts[2], testing.address);
    await expectThrow(
      testing.validateOrderTest(testOrder, signature)
    );
  });

  it("Test6. should validate IERC1271 with empty signature", async () => {
    const testOrder = order.Order(erc1271.address, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");

    await erc1271.setReturnSuccessfulValidSignature(false);
    
    await expectThrow(
      testing.validateOrderTest(testOrder, "0x")
    );

    await erc1271.setReturnSuccessfulValidSignature(true);

    await testing.validateOrderTest(testOrder, "0x");
  });

  it("Test7. should validate correct ERC1271 AND incorrect ECDSA signature", async () => {
    const testOrder = order.Order(erc1271.address, order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");

    await erc1271.setReturnSuccessfulValidSignature(true);

    // signature len = 65, but v = 1
    const signature = "0xae9f79f54ab16651972eb2f815e5c901cf39209d692e12261c91747324b81ec05aabe86556e1a9dc8786f4ebb8b0e547320aef8db1d0d8ac86ef837557829d7a01"
    await testing.validateOrderTest(testOrder, signature);
  });

  async function getSignature(Order, signer) {
    return order.sign(Order, signer, testing.address);
  }
});
