pragma solidity >=0.6.2 <0.8.0;

import "../../contracts/SecondarySaleFeesV1.sol";

contract FeesV1Impl is SecondarySaleFeesV1 {
    function getFeeRecipients(uint256) override external view returns (address payable[] memory result) {
        result = new address payable[](1);
        result[0] = address(uint160(address(this)));
    }

    function getFeeBps(uint256) override external view returns (uint[] memory result) {
        result = new uint[](1);
        result[0] = 100;
    }
}
