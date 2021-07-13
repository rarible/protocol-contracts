const LibSignatureTest = artifacts.require("LibSignatureTest.sol");
const order = require("../order");
const sign = order.sign;
const ZERO = "0x0000000000000000000000000000000000000000";

contract("LibSignature", accounts => {
	let testing;

	beforeEach(async () => {
		testing = await LibSignatureTest.new();
	});

	it("should return correct params from signature", async () => {
		const testOrder = order.Order(accounts[1], order.Asset("0xffffffff", "0x", 100), ZERO, order.Asset("0xffffffff", "0x", 200), 1, 0, 0, "0xffffffff", "0x");

		const signature = await getSignature(testOrder, accounts[1]);

        const r = "0x" + signature.slice(2, 66);
        const s = "0x" + signature.slice(66, 130);
        const v = parseInt(signature.slice(130, 132), 16)

		const params = await testing.getParamsFromSigTest(signature);

        assert.equal(params[0], r, "r param of signature")
        assert.equal(params[1], s, "s param of signature")
        assert.equal(params[2], v, "v param of signature")
	});

	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

});
