const LibSignatureTest = artifacts.require("LibSignatureTest.sol");
const {signPersonalMessage} = require("../sign.js");
const util = require('ethereumjs-util');

contract("LibSignature", accounts => {
	let libSignature;

	beforeEach(async () => {
		libSignature = await LibSignatureTest.new();
	});

	it("should return correct signer, case: v > 30", async () => {
		const msg = "myMessage";
		const hash = await libSignature.getKeccak(msg)
		const signature = await signPersonalMessage(hash, accounts[1]);

		const sig2 = signature.r + signature.s.substr(2) + (signature.v + 4).toString(16)

		const signer = await libSignature.recoverFromSigTest(hash, sig2);

		assert.equal(signer, accounts[1], "signer");
	});

	it("should return correct signer, default case: v < 30", async () => {
		const msg = "hello world";
		const hash = await libSignature.getKeccak(msg)

		//some random privateKey
		const privateKey = new Buffer("f1a884c5c58e8770b294e7db47eadc8ac5c5466211aa109515268c881c921ec4", "hex")
		
		//getting ethereum address of the given private key
		const realSigner = web3.utils.toChecksumAddress("0x" + util.privateToAddress(privateKey).toString('hex'))

		const signature = util.ecsign(util.toBuffer(hash), privateKey);

		const sig2 = "0x" + signature.r.toString('hex') + signature.s.toString('hex') + signature.v.toString(16)

		const signer = await libSignature.recoverFromSigTest(hash, sig2);
		assert.equal(signer, realSigner, "signer");

	});

});
