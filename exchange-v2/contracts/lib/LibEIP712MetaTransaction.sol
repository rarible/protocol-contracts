//SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/math/SafeMath.sol";

library LibEIP712MetaTransaction {
    using SafeMath for uint256;

    bytes32 private constant META_TRANSACTION_TYPEHASH = keccak256(bytes("MetaTransaction(uint256 nonce,address from,bytes functionSignature)"));
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    /*
     * Meta transaction structure.
     * No point of including value field here as if user is doing value transfer then he has the funds to pay for gas
     * He should call the desired function directly in that case.
     */
    struct MetaTransaction {
        uint256 nonce;
        address from;
        bytes functionSignature;
    }

    /*
     * Domain structure.
     * Data(information to for making metaTransaction method uniq) about method and contract
     */
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    event MetaTransactionExecuted(address userAddress, address payable relayerAddress, bytes functionSignature);

    function setDomainSeparator(string memory name, string memory version) internal returns (bytes32 domainSeparator){
        domainSeparator = keccak256(abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                bytes32(getChainID()),
                address(this)
            ));
    }

    /**
    * Accept message hash and returns hash message in EIP712 compatible form
    * So that it can be used to recover signer from signature signed using EIP712 formatted data
    * https://eips.ethereum.org/EIPS/eip-712
    * "\\x19" makes the encoding deterministic
    * "\\x01" is the version byte to make it compatible to EIP-191
    */
    function toTypedMessageHash(bytes32 messageHash, bytes32 _domainSeparator) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", _domainSeparator, messageHash));
    }

    function getChainID() public pure returns (uint256 id) {
        assembly {
            id := chainid()
        }
    }


    function convertBytesToBytes4(bytes memory inBytes) internal returns (bytes4 outBytes4) {
        if (inBytes.length == 0) {
            return 0x0;
        }

        assembly {
            outBytes4 := mload(add(inBytes, 32))
        }
    }

    function hashMetaTransaction(MetaTransaction memory metaTx) internal pure returns (bytes32) {
        return keccak256(abi.encode(
                META_TRANSACTION_TYPEHASH,
                metaTx.nonce,
                metaTx.from,
                keccak256(metaTx.functionSignature)
            ));
    }

    function _executeMetaTransaction(address userAddress, mapping(address => uint256) storage _nonces, bytes32 _domainSeparator,
        bytes memory functionSignature, bytes32 sigR, bytes32 sigS, uint8 sigV) internal returns (bytes memory) {
        bytes4 destinationFunctionSig = convertBytesToBytes4(functionSignature);
        require(destinationFunctionSig != msg.sig, "functionSignature can not be of executeMetaTransaction method");
        MetaTransaction memory metaTx = MetaTransaction({
        nonce : _nonces[userAddress],
        from : userAddress,
        functionSignature : functionSignature
        });
        require(verify(userAddress, metaTx, _domainSeparator, sigR, sigS, sigV), "Signer and signature do not match");
        _nonces[userAddress] = _nonces[userAddress].add(1);
        // Append userAddress at the end to extract it from calling context
        (bool success, bytes memory returnData) = address(this).call(abi.encodePacked(functionSignature, userAddress));

        require(success, "Function call not successful");
        emit MetaTransactionExecuted(userAddress, msg.sender, functionSignature);
        return returnData;
    }

    function verify(address user, MetaTransaction memory metaTx, bytes32 _domainSeparator, bytes32 sigR, bytes32 sigS, uint8 sigV) internal view returns (bool) {
        address signer = ecrecover(toTypedMessageHash(hashMetaTransaction(metaTx), _domainSeparator), sigV, sigR, sigS);
        require(signer != address(0), "Invalid signature");
        return signer == user;
    }

    function __msgSender() internal view returns (address payable sender) {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
            // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender := and(mload(add(array, index)), 0xffffffffffffffffffffffffffffffffffffffff)
            }
        } else {
            sender = msg.sender;
        }
        return sender;
    }
}
