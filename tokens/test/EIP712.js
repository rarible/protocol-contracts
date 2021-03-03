// Based on https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
const ethUtil = require('ethereumjs-util');
const abi = require('ethereumjs-abi');

// Recursively finds all the dependencies of a type
function dependencies(primaryType, found = [], types = {}) {
  if (found.includes(primaryType)) {
    return found;
  }
  if (types[primaryType] === undefined) {
    return found;
  }
  found.push(primaryType);
  for (let field of types[primaryType]) {
    for (let dep of dependencies(field.type, found)) {
      if (!found.includes(dep)) {
        found.push(dep);
      }
    }
  }
  return found;
}

function encodeType(primaryType, types = {}) {
  // Get dependencies primary first, then alphabetical
  let deps = dependencies(primaryType);
  deps = deps.filter(t => t != primaryType);
  deps = [primaryType].concat(deps.sort());

  // Format as a string with fields
  let result = '';
  for (let type of deps) {
    if (!types[type])
      throw new Error(`Type '${type}' not defined in types (${JSON.stringify(types)})`);
    result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(',')})`;
  }
  return result;
}

function typeHash(primaryType, types = {}) {
  return ethUtil.keccak256(encodeType(primaryType, types));
}

function encodeData(primaryType, data, types = {}) {
  let encTypes = [];
  let encValues = [];

  // Add typehash
  encTypes.push('bytes32');
  encValues.push(typeHash(primaryType, types));

  // Add field contents
  for (let field of types[primaryType]) {
    let value = data[field.name];
    if (field.type == 'string' || field.type == 'bytes') {
      encTypes.push('bytes32');
      value = ethUtil.keccak256(value);
      encValues.push(value);
    } else if (types[field.type] !== undefined) {
      encTypes.push('bytes32');
      value = ethUtil.keccak256(encodeData(field.type, value, types));
      encValues.push(value);
    } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
      throw 'TODO: Arrays currently unimplemented in encodeData';
    } else {
      encTypes.push(field.type);
      encValues.push(value);
    }
  }

  return abi.rawEncode(encTypes, encValues);
}

function domainSeparator(domain) {
  const types = {
    EIP712Domain: [
      {name: 'name', type: 'string'},
      {name: 'version', type: 'string'},
      {name: 'chainId', type: 'uint256'},
      {name: 'verifyingContract', type: 'address'},
      {name: 'salt', type: 'bytes32'}
    ].filter(a => domain[a.name])
  };
  return ethUtil.keccak256(encodeData('EIP712Domain', domain, types));
}

function structHash(primaryType, data, types = {}) {
  return ethUtil.keccak256(encodeData(primaryType, data, types));
}

function digestToSign(domain, primaryType, message, types = {}) {
  return ethUtil.keccak256(
    Buffer.concat([
      Buffer.from('1901', 'hex'),
      domainSeparator(domain),
      structHash(primaryType, message, types),
    ])
  );
}

function sign(domain, primaryType, message, types = {}, privateKey) {
  const digest = digestToSign(domain, primaryType, message, types);
  return {
    domain,
    primaryType,
    message,
    types,
    digest,
    ...ethUtil.ecsign(digest, ethUtil.toBuffer(privateKey))
  };
}
const DOMAIN_TYPE = [
  {
    type: "string",
    name: "name"
  },
	{
		type: "string",
		name: "version"
	},
  {
    type: "uint256",
    name: "chainId"
  },
  {
    type: "address",
    name: "verifyingContract"
  }
];

module.exports = {
  encodeType,
  typeHash,
  encodeData,
  domainSeparator,
  structHash,
  digestToSign,
  sign,

  createTypeData: function (domainData, primaryType, message, types) {
    return {
      types: Object.assign({
        EIP712Domain: DOMAIN_TYPE,
      }, types),
      domain: domainData,
      primaryType: primaryType,
      message: message
    };
  },

  signTypedData: function (web3, from, data) {
    return new Promise(async (resolve, reject) => {
      function cb(err, result) {
        if (err) {
          return reject(err);
        }
        if (result.error) {
          return reject(result.error);
        }

        const sig = result.result;
        const sig0 = sig.substring(2);
        const r = "0x" + sig0.substring(0, 64);
        const s = "0x" + sig0.substring(64, 128);
        const v = parseInt(sig0.substring(128, 130), 16);

        resolve({
          data,
          sig,
          v, r, s
        });
      }
      if (web3.currentProvider.isMetaMask) {
        web3.currentProvider.sendAsync({
          jsonrpc: "2.0",
          method: "eth_signTypedData_v3",
          params: [from, JSON.stringify(data)],
          id: new Date().getTime()
        }, cb);
      } else {
        let send = web3.currentProvider.sendAsync;
        if (!send) send = web3.currentProvider.send;
        send.bind(web3.currentProvider)({
          jsonrpc: "2.0",
          method: "eth_signTypedData",
          params: [from, data],
          id: new Date().getTime()
        }, cb);
      }
    });
  }
};