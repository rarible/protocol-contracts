import { BytesLike, ethers, utils } from 'ethers';
// Function to calculate CREATE2 address

export function calculateCreate2Address(sender: string, salt: string, initCodeHash: BytesLike): string {

    // Ensure inputs are 0x-prefixed hex strings
    const senderAddressHex = ethers.utils.getAddress(sender);
    const saltHex = ethers.utils.hexZeroPad(ethers.utils.hexlify(salt), 32);
    const initCodeHashHex = ethers.utils.hexlify(initCodeHash);

    // Calculate CREATE2 address
    const create2AddressBytes = ethers.utils.keccak256(
      '0x' +
        'ff' +
        senderAddressHex.slice(2) +
        saltHex.slice(2) +
        initCodeHashHex.slice(2)
    );
  
    // Take the last 20 bytes of the hash, then encode as an address
    const address = ethers.utils.getAddress('0x' + create2AddressBytes.slice(-40));
    return address;
  }

