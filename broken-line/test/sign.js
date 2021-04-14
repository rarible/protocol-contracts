const util = require('ethereumjs-util');

function pack(...args) {
  args = args.map(arg => {
    if (typeof arg === 'string') {
      if (arg.substring(0, 2) === '0x') {
          return arg.slice(2)
      } else {
          return web3.toHex(arg).slice(2)
      }
    }

    if (typeof arg === 'number') {
      return (arg).toString(16).padStart(64, '0')
    } else {
      return ''
    }
  })

  return args.join('')
}

function generateAddress() {
    var key = new Buffer(randomKey(), 'hex');
    var address = util.privateToAddress(key);
    return { key, address: ("0x" + address.toString("hex")) }
}

function calculate(key, address, value) {
    var hash = util.keccak256(new Buffer(pack(address, value), "hex"));
    var signature = util.ecsign(hash, key);
    return {
        v: signature.v,
        r: ("0x" + signature.r.toString("hex")),
        s: ("0x" + signature.s.toString("hex"))
    };
}

function calculateByMessage(key, message) {
		var hash = util.keccak256(new Buffer(message.substring(2), "hex"));
    var signature = util.ecsign(hash, key);
    return {
        v: signature.v,
        r: ("0x" + signature.r.toString("hex")),
        s: ("0x" + signature.s.toString("hex"))
    };
}

function randomKey() {
   var result           = '';
   var characters       = '0123456789abcdef';
   for ( var i = 0; i < 64; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
   }
   return result;
}

function randomAccount() {
    var key = new Buffer(randomKey(), 'hex');
    var address = util.privateToAddress(key);
    return {
        address: ("0x" + address.toString("hex")),
        key
    };
}

async function signPersonalMessage(message, account) {
    var signature = (await web3.eth.sign(message, account)).substr(2, 130);
    var v = util.bufferToInt(new Buffer(signature.substr(128, 2), "hex"));
    return {
        v: (v < 27 ? (v + 27) : v),
        r: ("0x" + signature.substr(0, 64)),
        s: ("0x" + signature.substr(64, 64))
    };
}

module.exports = {calculate, calculateByMessage, randomKey, randomAccount, signPersonalMessage, generateAddress};