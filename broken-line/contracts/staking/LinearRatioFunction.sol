pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./RatioFunction.sol";

contract LinearRatioFunction is RatioFunction {
    using SafeMath for uint;

    uint constant public MAX_PERIOD = 86400 * 365;
    uint constant ONE = 10**18;
    uint constant MIN_RATIO = 10**17;
    uint constant MAX_RATIO = 10**19;

    function getRatio(uint period) external view returns (uint) {
        if (period > MAX_PERIOD) {
            return MAX_RATIO;
        } else {
            uint addon = MAX_RATIO.sub(MIN_RATIO).mul(period).div(MAX_PERIOD);
            return MIN_RATIO.add(addon);
        }
    }
}
