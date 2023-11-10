const {deployments} = require('hardhat');

const ExchangeMetaV2 = artifacts.require("ExchangeMetaV2.sol");

const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
const TransferProxy = artifacts.require("TransferProxy.sol");
const ERC20TransferProxy = artifacts.require("ERC20TransferProxy.sol");

const RaribleTestHelper = artifacts.require("RaribleTestHelper.sol");

const TestERC20 = artifacts.require("TestERC20.sol");

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');
const { Order, Asset, sign } = require("../../../scripts/order.js");
const { ETH, ERC20, enc } = require("../../../scripts/assets.js");
const truffleAssert = require('truffle-assertions');

const ZERO = "0x0000000000000000000000000000000000000000";
const publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
const privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";

const cancelAbi = require("./cancelAbi.json")

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
  let r = signature.slice(0, 66);
  let s = "0x".concat(signature.slice(66, 130));
  let v = "0x".concat(signature.slice(130, 132));
  v = web3.utils.hexToNumber(v);
  if (![27, 28].includes(v)) v += 27;

  return { r, s, v, functionSignature };
}

contract("exchange v2 meta", accounts => {
  let exchangeV2meta
  let transferProxy;
  let erc20TransferProxy;
  let erc20;
  let helper;

  let left;
  let right;
  let salt;
  let chainId = 31337;

  before('before', async function () {
    const deployed = await deployments.fixture()

    salt = '0x' + (chainId).toString(16).padStart(64, '0');
    transferProxy = await TransferProxy.at(deployed["TransferProxy"].address)
    erc20TransferProxy = await ERC20TransferProxy.at(deployed["ERC20TransferProxy"].address);
    royaltiesRegistry = await RoyaltiesRegistry.at(deployed["RoyaltiesRegistry"].address)
    helper = await RaribleTestHelper.new()

    exchangeV2meta = await ExchangeMetaV2.at(deployed["ExchangeMetaV2"].address);

    domainData = {
      name: "ExchangeMetaV2",
      version: "1",
      verifyingContract: exchangeV2meta.address,
      salt: salt
    };

    erc20 = await TestERC20.new();
    await erc20.mint(accounts[1], 1000);
    await erc20.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

  });

  describe("Check Methods", function () {

    it("Should be able to send transaction successfully, and check Event, that emit from method, execute as MetaTx", async () => {

      const left = Order(publicKey, Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");

      const nonce = await exchangeV2meta.getNonce(publicKey);

      const {
        r,
        s,
        v,
        functionSignature
      } = await getTransactionData(nonce, cancelAbi, [left]);

      const resultExecMataTx = await exchangeV2meta.executeMetaTransaction(publicKey, functionSignature, r, s, v, { from: accounts[1] });
      let hash;
      truffleAssert.eventEmitted(resultExecMataTx, 'Cancel', (ev) => {
        hash = ev.hash;
        return true;
      });

      var newNonce = await exchangeV2meta.getNonce(publicKey);
      assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
      assert.equal(hash, await helper.hashKey(left));
    });

    it("ExchangeV2 meta, orders can match", async () => {
      const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(erc20.address), 100), 1, 0, 0, "0xffffffff", "0x");
      const right = Order(accounts[1], Asset(ERC20, enc(erc20.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
      const tx = await exchangeV2meta.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300 });
      console.log("ERC20<->eth, gas:", tx.receipt.gasUsed);
    })

  });

  async function getSignature(order, signer) {
    return sign(order, signer, exchangeV2meta.address);
  }
  
});
  
