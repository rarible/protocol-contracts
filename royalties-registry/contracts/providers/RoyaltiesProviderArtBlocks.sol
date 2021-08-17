// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "./RoyaltyArtBlocks.sol";
import "../lib/BpLibrary.sol";

contract RoyaltiesProviderArtBlocks is IRoyaltiesProvider {
    using SafeMathUpgradeable for uint;
    using BpLibrary for uint;

    uint96 artblocksPercentage = 250;
    address payable artblocksAddress;

    event ArtblocksAddressChanged(address _from, address _to);

    constructor(address payable _artblocksAddress) {
        require(_artblocksAddress != address(0), "invalid artblocksAddress");
        artblocksAddress = _artblocksAddress;
    }

    function getRoyalties(address token, uint tokenId) override external view returns(LibPart.Part[] memory) {

        RoyaltyArtBlocks artBlocks = RoyaltyArtBlocks(token);

        //gettign artist and additionalPayee royalty part
        (address artistAddress, address additionalPayee, uint256 additionalPayeePercentage, uint256 royaltyFeeByID) = artBlocks.getRoyaltyData(tokenId);

        //resulting royalties
        LibPart.Part[] memory result;

        if (additionalPayeePercentage > 0){
            result = new LibPart.Part[](3);
        } else {
            result = new LibPart.Part[](2);
        }

        //calculating artBLocks part
        result[0].account = artblocksAddress;
        result[0].value = artblocksPercentage;

        // additional payee percentage * 100
        uint96 additionalPart = uint96(royaltyFeeByID.mul(100).bp(additionalPayeePercentage.mul(100)));

        //artist part
        result[1].account = payable(artistAddress);
        result[1].value = uint96(royaltyFeeByID.mul(100)) - additionalPart;

        //additional payee part
        if (additionalPayeePercentage > 0) {
            result[2].account = payable(additionalPayee);
            result[2].value = additionalPart;
        }

        return result;
    }

    function setArtblocksAddress(address payable _artblocksAddress) external {
        require(_artblocksAddress != address(0), "invalid artblocksAddress");
        require(msg.sender == artblocksAddress, "no permission to change artblocksAddress");

        artblocksAddress = _artblocksAddress;

        emit ArtblocksAddressChanged(msg.sender, _artblocksAddress);
    }



}
