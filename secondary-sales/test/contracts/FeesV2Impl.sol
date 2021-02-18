pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "../../contracts/SecondarySaleFeesV2.sol";

contract FeesV2Impl is SecondarySaleFeesV2 {
    function getFees(uint256 id) override external view returns (LibSecondarySaleFeesV2.Fee[] memory result) {
        result = new LibSecondarySaleFeesV2.Fee[](1);
        result[0] = LibSecondarySaleFeesV2.Fee(address(this), 100);
    }
}
