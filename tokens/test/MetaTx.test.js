const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ERC721MetaTx = artifacts.require("ERC721RaribleMeta.sol");
const ERC721NoMetaTx = artifacts.require("ERC721RaribleMinimal.sol");

const ERC1155MetaTx = artifacts.require("ERC1155RaribleMeta.sol");
const ERC1155NoMetaTx = artifacts.require("ERC1155Rarible.sol");

const web3Abi = require('web3-eth-abi');
const sigUtil = require('eth-sig-util');
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");

let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
let publicKey = "0x726cDa2Ac26CeE89F645e55b78167203cAE5410E";
let privateKey = "0x68619b8adb206de04f676007b2437f99ff6129b672495a6951499c6c56bc2fa6";
let balanceOfAbi =  require("./contracts/balanceOfAbi.json");
let balanceOf1155Abi =  require("./contracts/balanceOf1155Abi.json");

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

const getTransactionData = async (nonce, abi, params, domainData) => {
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

contract("MetaTxTokenTest", accounts => {
  let erc721NoMetaTx;
  let erc721WithMetaTx;
  let erc721UserNoMetaTx;
  let erc721UserWithMetaTx;
  let erc1155NoMetaTx;
  let erc1155WithMetaTx;
  let erc1155UserNoMetaTx;
  let erc1155UserWithMetaTx;
  let salt;
  let chainId = 1337;

  beforeEach(async () => {
    salt = '0x' + (chainId).toString(16).padStart(64, '0');
    erc721NoMetaTx = await deployProxy(ERC721NoMetaTx, ["Rarible", "RARI", "ipfs:/", "", ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC721Rarible_init' });
    erc721WithMetaTx = await deployProxy(ERC721MetaTx, ["Rarible", "RARI", "ipfs:/", "", ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC721Rarible_init' });

    erc721UserNoMetaTx = await deployProxy(ERC721NoMetaTx, ["Rarible", "RARI", "ipfs:/", "", [], ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC721RaribleUser_init' });
    erc721UserWithMetaTx = await deployProxy(ERC721MetaTx, ["Rarible", "RARI", "ipfs:/", "", [], ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC721RaribleUser_init' });

    erc1155NoMetaTx = await deployProxy(ERC1155NoMetaTx, ["Rarible", "RARI", "ipfs:/", "", ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC1155Rarible_init' });
    erc1155WithMetaTx = await deployProxy(ERC1155MetaTx, ["Rarible", "RARI", "ipfs:/", "", ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC1155Rarible_init' });

    erc1155UserNoMetaTx = await deployProxy(ERC1155NoMetaTx, ["Rarible", "RARI", "ipfs:/", "", [], ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC1155RaribleUser_init' });
    erc1155UserWithMetaTx = await deployProxy(ERC1155MetaTx, ["Rarible", "RARI", "ipfs:/", "", [], ZERO_ADDRESS, ZERO_ADDRESS], { initializer: '__ERC1155RaribleUser_init' });

    domainData721Rarible = {
          name: "ERC721RaribleMeta",
          version: "1",
          verifyingContract: erc721WithMetaTx.address,
          salt: salt
        };
    domainData1155Rarible = {
          name: "ERC1155RaribleMeta",
          version: "1",
          verifyingContract: erc1155WithMetaTx.address,
          salt: salt
        };
    domainData721RaribleUser = {
          name: "ERC721RaribleUserMeta",
          version: "1",
          verifyingContract: erc721UserWithMetaTx.address,
          salt: salt
        };
    domainData1155RaribleUser = {
          name: "ERC1155RaribleUserMeta",
          version: "1",
          verifyingContract: erc1155UserWithMetaTx.address,
          salt: salt
        };
  });

  it("Upgrade, which use MetaTransaction for ERC721RaribleMeta token works", async () => {
  		const wrapper = await ERC721MetaTx.at(erc721NoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc721NoMetaTx.address, ERC721MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Use metaTransaction call for ERC721RaribleMeta token", async () => {
  	let nonce = await erc721WithMetaTx.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, balanceOfAbi, [publicKey], domainData721Rarible);
    let resultExecMataTx = await erc721WithMetaTx.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]});
    let metaResult;
    truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
     	metaResult = ev.result;
      return true;
    });
    var newNonce = await erc721WithMetaTx.getNonce(publicKey);
    assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
  });

  it("Upgrade, which use MetaTransaction for ERC721RaribleUserMeta token works", async () => {
  		const wrapper = await ERC721MetaTx.at(ERC721NoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(ERC721NoMetaTx.address, ERC721MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Use metaTransaction call for ERC721UserRaribleMeta token", async () => {
    	let nonce = await erc721UserWithMetaTx.getNonce(publicKey);
    	let {
        r,
        s,
        v,
        functionSignature
      } = await getTransactionData(nonce, balanceOfAbi, [publicKey], domainData721RaribleUser);
      let resultExecMataTx = await erc721UserWithMetaTx.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]});
      let metaResult;
      truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
       	metaResult = ev.result;
        return true;
      });
      var newNonce = await erc721UserWithMetaTx.getNonce(publicKey);
      assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
    });

  it("Upgrade, which use MetaTransaction for ERC1155RaribleMeta token works", async () => {
  		const wrapper = await ERC1155MetaTx.at(erc1155NoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc1155NoMetaTx.address, ERC1155MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Use metaTransaction call for ERC1155RaribleMeta token", async () => {
  	let nonce = await erc1155WithMetaTx.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, balanceOf1155Abi, [publicKey, 1314], domainData1155Rarible);
    let resultExecMataTx = await erc1155WithMetaTx.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]});
    let metaResult;
    truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
     	metaResult = ev.result;
      return true;
    });
    var newNonce = await erc1155WithMetaTx.getNonce(publicKey);
    assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
  });

  it("Upgrade, which use MetaTransaction for ERC1155RaribleUserMeta token works", async () => {
  		const wrapper = await ERC1155MetaTx.at(erc1155UserNoMetaTx.address);
  		await expectThrow(
  			wrapper.getNonce(ZERO_ADDRESS)
  		);

  		await upgradeProxy(erc1155UserNoMetaTx.address, ERC1155MetaTx);
  		assert.equal(await wrapper.getNonce(ZERO_ADDRESS), 0);
  });

  it("Use metaTransaction call for ERC1155RaribleUserMeta token", async () => {
  	let nonce = await erc1155UserWithMetaTx.getNonce(publicKey);
  	let {
      r,
      s,
      v,
      functionSignature
    } = await getTransactionData(nonce, balanceOf1155Abi, [publicKey, 1314], domainData1155RaribleUser);
    let resultExecMataTx = await erc1155UserWithMetaTx.executeMetaTransaction(publicKey, functionSignature, r, s, v, {from: accounts[0]});
    let metaResult;
    truffleAssert.eventEmitted(resultExecMataTx, 'MetaTransactionExecuted', (ev) => {
     	metaResult = ev.result;
      return true;
    });
    var newNonce = await erc1155UserWithMetaTx.getNonce(publicKey);
    assert.isTrue(newNonce.toNumber() == nonce + 1, "Nonce not incremented");
  });
});