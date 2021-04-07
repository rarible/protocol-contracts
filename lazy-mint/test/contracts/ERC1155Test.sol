pragma solidity ^0.7.0;
pragma abicoder v2;

import "../../contracts/erc-1155/LibERC1155LazyMint.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/drafts/EIP712Upgradeable.sol";

contract ERC1155Test is EIP712Upgradeable {
    using ECDSAUpgradeable for bytes32;

    function __ERC1155Test_init() external initializer {
        __EIP712_init("Mint1155", "1");
    }

    function recover(LibERC1155LazyMint.Mint1155Data memory data, bytes memory signature) external view returns (address) {
        bytes32 structHash = LibERC1155LazyMint.hash(data);
        bytes32 hash = _hashTypedDataV4(structHash);
        return hash.recover(signature);
    }
}
