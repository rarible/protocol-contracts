// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/introspection/IERC165Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

abstract contract HasContractURI is Initializable, IERC165Upgradeable {

    string public contractURI;

    function __HasContractURI_init_unchained(string memory _contractURI) internal initializer {
        contractURI = _contractURI;
    }

    /**
     * @dev Internal function to set the contract URI
     * @param _contractURI string URI prefix to assign
     */
    function _setContractURI(string memory _contractURI) internal {
        contractURI = _contractURI;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     *
     * Time complexity O(1), guaranteed to always use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(HasContractURI).interfaceId;
    }

    uint256[50] private __gap;
}
