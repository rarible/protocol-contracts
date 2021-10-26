// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";

contract TestRoyaltiesRegistry is IRoyaltiesProvider {
	mapping(bytes32 => LibPart.Part[]) public royaltiesByTokenAndTokenId;

	function setRoyalties(address token, uint tokenId, LibPart.Part[] memory royalties) external {
    bytes32 key = keccak256(abi.encode(token, tokenId));
    for (uint i = 0; i < royalties.length; i++){
      royaltiesByTokenAndTokenId[key].push(LibPart.Part(royalties[i].account, royalties[i].value));
    }
	}

	function getRoyalties(address token, uint tokenId) view override external returns (LibPart.Part[] memory) {
		return royaltiesByTokenAndTokenId[keccak256(abi.encode(token, tokenId))];
	}

}
