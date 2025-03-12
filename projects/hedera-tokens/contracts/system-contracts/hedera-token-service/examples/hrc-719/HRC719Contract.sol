// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "../../IHRC719.sol";

contract HRC719Contract {
    event IsAssociated(bool status);
    
    /// @dev Associate caller with token contract that implements the IHRC719 interface
    /// @param token The address of the token to associate with.
    /// @return responseCode The response code of the association.
    function associate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).associate();
    }

    
    /// @dev Dissociate caller with token contract that implements the IHRC719 interface
    /// @param token The address of the token to dissociate with.
    /// @return responseCode The response code of the dissociation.
    function dissociate(address token) public returns (uint256 responseCode) {
        return IHRC719(token).dissociate();
    }

    /// @dev Calls the `isAssociated` function on the token contract that implements the IHRC719 interface.
    /// @param token The address of the token to associate with.
    /// @notice Making isAssociated(address) non-view function to avoid going through mirror-node as isAssociated() is not yet fully supported on mirror node.
    /// @notice Should be transitioned to view function when the feature is supported by mirror node. Tracking by this issue https://github.com/hashgraph/hedera-smart-contracts/issues/948
    function isAssociated(address token) public {
        bool status = IHRC719(token).isAssociated();
        emit IsAssociated(status);
    }
}
