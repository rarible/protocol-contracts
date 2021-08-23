// SPDX-License-Identifier: MIT

pragma solidity >=0.6.9 <0.8.0;
pragma abicoder v2;

import "@rarible/royalties/contracts/IRoyaltiesProvider.sol";
import "./RoyaltyArtBlocks.sol";
import "../lib/BpLibrary.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltiesProviderArtBlocks is IRoyaltiesProvider, Ownable {
    using SafeMathUpgradeable for uint;
    using BpLibrary for uint;

    uint96 public artblocksPercentage = 250;

    event ArtblocksPercentageChanged(address _who, uint96 _old, uint96 _new);

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
        result[0].account = payable(owner());
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

    //sets new value for artblocksPercentage
    function setArtblocksPercentage(uint96 _artblocksPercentage) onlyOwner public {
        emit ArtblocksPercentageChanged(_msgSender(), artblocksPercentage, _artblocksPercentage);
        artblocksPercentage = _artblocksPercentage;
    }

}
