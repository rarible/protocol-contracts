const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const MetaTxTest = artifacts.require("MetaTxTest.sol");

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");

let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
let privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";

let balanceOfAbi =  require("./contracts/abi/balanceOfAbi.json");
let sumAbi = require("./contracts/abi/sumAbi.json");
let getNonceAbi = require("./contracts/abi/getNonceAbi.json");
let executeMetaTransactionABI = require("./contracts/abi/executeMetaTransactionAbi.json");

const domainType = [{
    name: "name",
    type: "string"
  },
  {
    name: "version",
    type: "string"
  },
  {
    name: "chainId",
    type: "uint256"
  },
  {
    name: "verifyingContract",
    type: "address"
  }
];
const metaTransactionType = [{
    name: "nonce",
    type: "uint256"
  },
  {
    name: "from",
    type: "address"
  },
  {
    name: "functionSignature",
    type: "bytes"
  }
];
let domainData;

const getTransactionData = async (nonce, abi, params) => {
  const functionSignature = web3Abi.encodeFunctionCall(
    abi,
    params
  );

  let message = {};
  message.nonce = parseInt(nonce);
  message.from = publicKey;
  message.functionSignature = functionSignature;
  const dataToSign = {
    types: {
      EIP712Domain: domainType,
      MetaTransaction: metaTransactionType
    },
    domain: domainData,
    primaryType: "MetaTransaction",
    message: message
  };
  const signature = sigUtil.signTypedData_v4(new Buffer(privateKey.substring(2, 66), 'hex'), {
    data: dataToSign
  });
//    console.log("test:"+sigUtil.recoverTypedSignature_v4({sig:signature, data:dataToSign}) ); for test only
  let r = signature.slice(0, 66);
  let s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;

  return {r, s, v, functionSignature};
}

contract("ERC721MetaTxTokenTestAllien", accounts => {
  let erc721NoMetaTx;
  let metaTxTest;
  let owner = accounts[0];

  beforeEach(async () => {
    metaTxTest = await deployProxy(MetaTxTest, ["MetaTxTest", "1"], { initializer: '__MetaTxTest_init' });

    domainData = {
          name: "MetaTxTest",
          version: "1",
          verifyingContract: metaTxTest.address,
          chainId: 1337
        };
  });

  it("Call unknown abi-method, use metaTx, throw ", async () => {
  	let nonce = await metaTxTest.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, balanceOfAbi, [publicKey]);
    await expectThrow(
      metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]})
     );

  });

  it("Call known abi-method, use metaTx ", async () => {
  	let nonce = await metaTxTest.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, sumAbi, [5,6]);
    let resultExecMataTx = await metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]})

    var newNonce = await metaTxTest.getNonce(publicKey);
    assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
  });

  it("Call known abi-method(getNonce), use metaTx, for check contract support metaTx", async () => {
  	let nonce = await metaTxTest.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, getNonceAbi, [ZERO_ADDRESS]);
    let resultExecMataTx = await metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]})

    var newNonce = await metaTxTest.getNonce(publicKey);
    assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
  });

  it("Call known abi-method(getNonce), use metaTx, for check Event from contract support metaTx", async () => {
  	let nonce = await metaTxTest.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, getNonceAbi, [ZERO_ADDRESS]);
    let resultExecMataTx = await metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]})

    let eventFunctionSignature;
    truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
   	  eventFunctionSignature = ev.functionSignature;
      return true;
    });
    assert.equal(functionSignature, eventFunctionSignature);
  });

  it("Call known abi-method(getNonceAbi), use metaTx, error in part v throw", async () => {
  	let nonce = await metaTxTest.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, getNonceAbi, [ZERO_ADDRESS]);
    await expectThrow(
      metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v+1, {from: accounts[0]}) //v+1 - insert error for test only
    );
  });

  it("Call known abi-method, check event from method which call as metaTx ", async () => {
  	let nonce = await metaTxTest.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, sumAbi, [5, 6]);
    let resultExecMataTx = await metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]})

    let metaResult;
    truffleAssert.eventEmitted(resultExecMataTx, 'SimpleEventSum', (ev) => {
     	metaResult = ev.result;
      return true;
    });
    assert.equal(metaResult, 11);
  });

  it("Check Event MetaTransactionExecuted", async () => {
    let nonce = await metaTxTest.getNonce(publicKey);

    let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, sumAbi, [5, 8]);

    let sendTransactionData = web3Abi.encodeFunctionCall(
      executeMetaTransactionABI,
      [publicKey, functionSignature, r, s, v]
    );
    let resultExecMataTx  = await metaTxTest.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: owner});

    let userAddress;
    truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
   	  userAddress = ev.relayerAddress;
      return true;
    });
    assert.equal(userAddress, owner);
  });

  it("Call the contract method directly", async() => {
    var oldNonce = await metaTxTest.getNonce(publicKey);
    let sendTransactionData = web3Abi.encodeFunctionCall(
      sumAbi, [3, 6]
    );

    await metaTxTest.sendTransaction({
      value: 0,
      from: owner,
      gas: 500000,
      data: sendTransactionData
    });

    var newNonce = await metaTxTest.getNonce(publicKey);
    assert.isTrue(newNonce.toNumber() == oldNonce.toNumber(), "Nonce are not same");
  })

  it("Should fail when try to call executeMetaTransaction method itself", async () => {
    let nonce = await metaTxTest.getNonce(publicKey, {
      from: owner
    });
    let setQuoteData = await getTransactionData(nonce, sumAbi, [3, 9]);
    let {r, s, v, functionSignature} = await getTransactionData(nonce,
      executeMetaTransactionABI,
      [publicKey, setQuoteData.functionSignature, setQuoteData.r, setQuoteData.s, setQuoteData.v])
    const sendTransactionData = web3Abi.encodeFunctionCall(
      executeMetaTransactionABI,
      [publicKey, functionSignature, r, s, v]
    );

    try {
      await metaTxTest.sendTransaction({
        value: 0,
        from: owner,
        gas: 500000,
        data: sendTransactionData
      });
    } catch (error) {
      assert.isTrue(error.message.includes("functionSignature can not be of executeMetaTransaction method"), `Wrong failure type`);
    }
  });

  it("Should fail when replay transaction", async () => {
    let nonce = await metaTxTest.getNonce(publicKey, {
        from: owner
    });
    let {
        r,
        s,
        v,
        functionSignature
    } = await getTransactionData(nonce, sumAbi, [3, 9]);

    const sendTransactionData = web3Abi.encodeFunctionCall(
        executeMetaTransactionABI,
        [publicKey, functionSignature, r, s, v]
    );

    await metaTxTest.sendTransaction({
        value: 0,
        from: owner,
        gas: 500000,
        data: sendTransactionData
    });

    try {
        await metaTxTest.sendTransaction({
            value: 0,
            from: owner,
            gas: 500000,
            data: sendTransactionData
        });
    } catch (error) {
        assert.isTrue(error.message.includes("Signer and signature do not match"), `Wrong failure type`);
    }
  });

  it("Should fail when user address is Zero", async () => {
    let nonce = await metaTxTest.getNonce(publicKey, {
        from: owner
    });
    let {
        r,
        s,
        v,
        functionSignature
    } = await getTransactionData(nonce, sumAbi, [3, 9]);

    const sendTransactionData = web3Abi.encodeFunctionCall(
        executeMetaTransactionABI,
        [ZERO_ADDRESS, functionSignature, r, s, v]
    );

    try {
        await metaTxTest.sendTransaction({
            value: 0,
            from: owner,
            gas: 500000,
            data: sendTransactionData
        });
    } catch (error) {
        assert.isTrue(error.message.includes("Signer and signature do not match"), `Wrong failure type`);
    }
  });

  it("Should be failed - Signer and Signature do not match", async () => {
    let nonce = await metaTxTest.getNonce(publicKey, {
        from: owner
    });
    let {
        r,
        s,
        v,
        functionSignature
    } = await getTransactionData(nonce, sumAbi, [3, 9]);

    const sendTransactionData = web3Abi.encodeFunctionCall(
        executeMetaTransactionABI,
        [accounts[1], functionSignature, r, s, v]
    );

    try {
        await metaTxTest.sendTransaction({
            value: 0,
            from: owner,
            gas: 500000,
            data: sendTransactionData
        });
    } catch (error) {
        assert.isTrue(error.message.includes("Signer and signature do not match"), `Wrong failure type`);
    }
  });

});