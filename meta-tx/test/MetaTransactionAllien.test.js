const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const MetaTxTest = artifacts.require("MetaTxTest.sol");

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");

let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
let privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";
let balanceOfAbi =  {
  "inputs": [
    {
      "internalType": "address",
      "name": "owner",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  "stateMutability": "view",
  "type": "function"
};
let sumAbi = {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "a",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "b",
          "type": "uint256"
        }
      ],
      "name": "sumTest",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    };
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

});