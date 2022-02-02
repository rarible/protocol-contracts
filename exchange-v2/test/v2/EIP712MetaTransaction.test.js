const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ExchangeSimpleV2 = artifacts.require("ExchangeSimpleV2.sol");
const ExchangeSimpleV2_MetaTx = artifacts.require("ExchangeSimpleV2_MetaTx.sol");
const ExchangeMetaV2 = artifacts.require("ExchangeMetaV2.sol");

const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const TestERC20 = artifacts.require("TestERC20.sol");

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');
const { Order, Asset, sign } = require("../order");
const { ETH, ERC20, ERC721, ERC1155, enc, id } = require("../assets");
const { expectThrow } = require("@daonomic/tests-common");
const truffleAssert = require('truffle-assertions');

const ZERO = "0x0000000000000000000000000000000000000000";
let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
let privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";

let cancelAbi = require("./cancelAbi.json")

let quoteToBeSet = "Divya";

const domainType = [{
    name: "name",
    type: "string"
  },
  {
    name: "version",
    type: "string"
  },
  {
    name: "verifyingContract",
    type: "address"
  },
  {
    name: "salt",
    type: "bytes32"
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

contract("EIP712MetaTransaction", function ([_, owner, account1]) {
  let testContract
  let testContractSimple;
  let transferProxy;
  let erc20TransferProxy;
  let t1;
  let t2;
  let community = account1;
  let left;
  let right;
  let salt;
  let chainId = 1337;

  before('before', async function () {
    salt = '0x' + (chainId).toString(16).padStart(64, '0');
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    royaltiesRegistry = await TestRoyaltiesRegistry.new();
    testContract = await deployProxy(ExchangeMetaV2, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__ExchangeV2_init" });
    testingSimpleContract = await deployProxy(ExchangeSimpleV2, [transferProxy.address, erc20TransferProxy.address], { initializer: "__ExchangeSimpleV2_init" });
    t1 = await TestERC20.new();
    t2 = await TestERC20.new();

    domainData = {
      name: "ExchangeV2",
      version: "1",
      verifyingContract: testContract.address,
      salt: salt
    };

    await t1.mint(owner, 100);
    await t1.approve(erc20TransferProxy.address, 10000000, { from: owner });
    left = Order(publicKey, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
    right = Order(owner, Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ERC20, enc(t2.address), 200), 1, 0, 0, "0xffffffff", "0x");
  });

  describe("Check Methods", function () {
  	it("upgrade, which use MetaTransaction  works", async () => {
  		const wrapper = await ExchangeSimpleV2_MetaTx.at(testingSimpleContract.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(testingSimpleContract.address, ExchangeSimpleV2_MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  	});

    it("Should be able to send transaction successfully, and check Event, that emit from method, execute as MetaTx", async () => {
      let nonce = await testContract.getNonce(publicKey);

      let {
        r,
        s,
        v,
        functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);
//        Way №1 call transaction
//      let sendTransactionData = web3Abi.encodeFunctionCall(
//        executeMetaTransactionABI,
//        [publicKey, functionSignature, r, s, v]
//      );
//
//        await testContract.sendTransaction({
//            value: 0,
//            from: owner,
//            gas: 500000,
//            data: sendTransactionData
//        });
//        Way №2 call transaction
      let resultExecMataTx  = await testContract.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: owner});
      let orderMakerAddress;
      truffleAssert.eventEmitted(resultExecMataTx, 'Cancel', (ev) => {
       	orderMakerAddress = ev.maker;
        return true;
      });
      //console.log("orderMakerAddress:"+orderMakerAddress); //TEST only, no need
      var newNonce = await testContract.getNonce(publicKey);
      assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
      assert.equal(orderMakerAddress, publicKey);
      //NB! check orderMakerAddress == _msgSender() inside method with cancelAbi, so _msgSender() - also correct
    });

  });
});
