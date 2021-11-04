// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import"@rarible/royalties-registry/contracts/RoyaltiesRegistry.sol";

contract TestRoyaltiesRegistryNew is RoyaltiesRegistry {

	function __TestRoyaltiesRegistryNew_init() external initializer {
		__Ownable_init_unchained();
	}
}
