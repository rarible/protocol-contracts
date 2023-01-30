// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "./LibIntMapping.sol";
/**
  * Line describes a linear function, how the user's voice decreases from point (start, bias) with speed slope
  * BrokenLine - a curve that describes the curve of the change in the sum of votes of several users
  * This curve starts with a line (Line) and then, at any time, the slope can be changed.
  * All slope changes are stored in slopeChanges. The slope can always be reduced only, it cannot increase,
  * because users can only run out of lockup periods.
  **/

library LibBrokenLine {
    using LibIntMapping for mapping(uint => int96);

    using SignedSafeMathUpgradeable96 for int96;

    using SafeMathUpgradeable96 for uint96;
    using SafeMathUpgradeable32 for uint32;

    struct Line {
        uint32 start;
        uint96 bias;
        uint96 slope;
        uint32 cliff;
    }

    struct BrokenLine {
        mapping(uint => int96) slopeChanges;          //change of slope applies to the next time point
        mapping(uint => int96) biasChanges;           //change of bias applies to the next time point
        mapping(uint => Line) initiatedLines;   //initiated (successfully added) Lines
        Line initial;
    }

    /**
     * @dev Add Line, save data in LineData. Run update BrokenLine, require:
     *      1. slope != 0, slope <= bias
     *      2. line not exists
     **/
    function add(BrokenLine storage brokenLine, uint id, Line memory line) internal {
        require(line.slope != 0, "Slope == 0, unacceptable value for slope");
        require(line.slope <= line.bias, "Slope > bias, unacceptable value for slope");
        require(brokenLine.initiatedLines[id].bias == 0, "Line with given id is already exist");
        brokenLine.initiatedLines[id] = line;

        update(brokenLine, line.start);
        brokenLine.initial.bias = brokenLine.initial.bias.add(line.bias);
        //save bias for history in line.start minus one
        uint32 lineStartMinusOne = line.start.sub(1);
        brokenLine.biasChanges.addToItem(lineStartMinusOne, safeInt(line.bias));
        //period is time without tail
        uint32 period = uint32(line.bias.div(line.slope));

        if (line.cliff == 0) {
            //no cliff, need to increase brokenLine.initial.slope write now
            brokenLine.initial.slope = brokenLine.initial.slope.add(line.slope);
            //no cliff, save slope in history in time minus one
            brokenLine.slopeChanges.addToItem(lineStartMinusOne, safeInt(line.slope));
        } else {
            //cliffEnd finish in lineStart minus one plus cliff
            uint32 cliffEnd = lineStartMinusOne.add(line.cliff);
            //save slope in history in cliffEnd 
            brokenLine.slopeChanges.addToItem(cliffEnd, safeInt(line.slope));
            period = period.add(line.cliff);
        }

        int96 mod = safeInt(line.bias.mod(line.slope));
        uint32 endPeriod = line.start.add(period);
        uint32 endPeriodMinus1 = endPeriod.sub(1);
        brokenLine.slopeChanges.subFromItem(endPeriodMinus1, safeInt(line.slope).sub(mod));
        brokenLine.slopeChanges.subFromItem(endPeriod, mod);
    }

    /**
     * @dev Remove Line from BrokenLine, return bias, slope, cliff. Run update BrokenLine.
     **/
    function remove(BrokenLine storage brokenLine, uint id, uint32 toTime) internal returns (uint96 bias, uint96 slope, uint32 cliff) {
        Line memory line = brokenLine.initiatedLines[id];
        require(line.bias != 0, "Removing Line, which not exists");

        update(brokenLine, toTime);
        //check time Line is over
        bias = line.bias;
        slope = line.slope;
        cliff = 0;
        //for information: bias.div(slope) - this`s period while slope works
        uint32 finishTime = line.start.add(uint32(bias.div(slope))).add(line.cliff);
        if (toTime > finishTime) {
            bias = 0;
            slope = 0;
            return (bias, slope, cliff);
        }
        uint32 finishTimeMinusOne = finishTime.sub(1);
        uint32 toTimeMinusOne = toTime.sub(1);
        int96 mod = safeInt(bias.mod(slope));
        uint32 cliffEnd = line.start.add(line.cliff).sub(1);
        if (toTime <= cliffEnd) {//cliff works
            cliff = cliffEnd.sub(toTime).add(1);
            //in cliff finish time compensate change slope by oldLine.slope
            brokenLine.slopeChanges.subFromItem(cliffEnd, safeInt(slope));
            //in new Line finish point use oldLine.slope
            brokenLine.slopeChanges.addToItem(finishTimeMinusOne, safeInt(slope).sub(mod));
        } else if (toTime <= finishTimeMinusOne) {//slope works
            //now compensate change slope by oldLine.slope
            brokenLine.initial.slope = brokenLine.initial.slope.sub(slope);
            //in new Line finish point use oldLine.slope
            brokenLine.slopeChanges.addToItem(finishTimeMinusOne, safeInt(slope).sub(mod));
            bias = uint96(finishTime.sub(toTime)).mul(slope).add(uint96(mod));
            //save slope for history
            brokenLine.slopeChanges.subFromItem(toTimeMinusOne, safeInt(slope));
        } else {//tail works
            //now compensate change slope by tail
            brokenLine.initial.slope = brokenLine.initial.slope.sub(uint96(mod));
            bias = uint96(mod);
            slope = bias;
            //save slope for history
            brokenLine.slopeChanges.subFromItem(toTimeMinusOne, safeInt(slope));
        }
        brokenLine.slopeChanges.addToItem(finishTime, mod);
        brokenLine.initial.bias = brokenLine.initial.bias.sub(bias);
        brokenLine.initiatedLines[id].bias = 0;
        //save bias for history
        brokenLine.biasChanges.subFromItem(toTimeMinusOne, safeInt(bias));
    }

    /**
     * @dev Update initial Line by parameter toTime. Calculate and set all changes
     **/
    function update(BrokenLine storage brokenLine, uint32 toTime) internal {
        uint32 time = brokenLine.initial.start;
        if (time == toTime) {
            return;
        }
        uint96 slope = brokenLine.initial.slope;
        uint96 bias = brokenLine.initial.bias;
        if (bias != 0) {
            require(toTime > time, "can't update BrokenLine for past time");
            while (time < toTime) {
                bias = bias.sub(slope);

                int96 newSlope = safeInt(slope).add(brokenLine.slopeChanges[time]);
                require(newSlope >= 0, "slope < 0, something wrong with slope");
                slope = uint96(newSlope);

                time = time.add(1);
            }
        }
        brokenLine.initial.start = toTime;
        brokenLine.initial.bias = bias;
        brokenLine.initial.slope = slope;
    }

    function actualValue(BrokenLine storage brokenLine, uint32 toTime) internal view returns (uint96) {
        uint32 fromTime = brokenLine.initial.start;
        uint96 bias = brokenLine.initial.bias;
        if (fromTime == toTime) {
            return (bias);
        }

        if (toTime > fromTime) {
            return actualValueForward(brokenLine, fromTime, toTime, bias);
        }
        require(toTime > 0, "unexpected past time");
        return actualValueBack(brokenLine, fromTime, toTime, bias);
    }

    function actualValueForward(BrokenLine storage brokenLine, uint32 fromTime, uint32 toTime, uint96 bias) internal view returns (uint96) {
        if ((bias == 0)){
            return (bias);
        }
        uint96 slope = brokenLine.initial.slope;
        uint32 time = fromTime;

        while (time < toTime) {
            bias = bias.sub(slope);

            int96 newSlope = safeInt(slope).add(brokenLine.slopeChanges[time]);
            require(newSlope >= 0, "slope < 0, something wrong with slope");
            slope = uint96(newSlope);

            time = time.add(1);
        }
        return bias;
    }

    function actualValueBack(BrokenLine storage brokenLine, uint32 fromTime, uint32 toTime, uint96 bias) internal view returns (uint96) {
        uint96 slope = brokenLine.initial.slope;
        uint32 time = fromTime;

        while (time > toTime) {
            time = time.sub(1);

            int96 newBias = safeInt(bias).sub(brokenLine.biasChanges[time]);
            require(newBias >= 0, "bias < 0, something wrong with bias");
            bias = uint96(newBias);

            int96 newSlope = safeInt(slope).sub(brokenLine.slopeChanges[time]);
            require(newSlope >= 0, "slope < 0, something wrong with slope");
            slope = uint96(newSlope);

            bias = bias.add(slope);
        }
        return bias;
    }

    function safeInt(uint96 value) pure internal returns (int96 result) {
        require(value < 2**95, "int cast error");
        result = int96(value);
    }
}



library SafeMathUpgradeable96 {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint96 a, uint96 b) internal pure returns (bool, uint96) {
        uint96 c = a + b;
        if (c < a) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint96 a, uint96 b) internal pure returns (bool, uint96) {
        if (b > a) return (false, 0);
        return (true, a - b);
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint96 a, uint96 b) internal pure returns (bool, uint96) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) return (true, 0);
        uint96 c = a * b;
        if (c / a != b) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint96 a, uint96 b) internal pure returns (bool, uint96) {
        if (b == 0) return (false, 0);
        return (true, a / b);
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint96 a, uint96 b) internal pure returns (bool, uint96) {
        if (b == 0) return (false, 0);
        return (true, a % b);
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint96 a, uint96 b) internal pure returns (uint96) {
        uint96 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint96 a, uint96 b) internal pure returns (uint96) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint96 a, uint96 b) internal pure returns (uint96) {
        if (a == 0) return 0;
        uint96 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint96 a, uint96 b) internal pure returns (uint96) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint96 a, uint96 b) internal pure returns (uint96) {
        require(b > 0, "SafeMath: modulo by zero");
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint96 a, uint96 b, string memory errorMessage) internal pure returns (uint96) {
        require(b <= a, errorMessage);
        return a - b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryDiv}.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint96 a, uint96 b, string memory errorMessage) internal pure returns (uint96) {
        require(b > 0, errorMessage);
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint96 a, uint96 b, string memory errorMessage) internal pure returns (uint96) {
        require(b > 0, errorMessage);
        return a % b;
    }
}

library SafeMathUpgradeable32 {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint32 a, uint32 b) internal pure returns (bool, uint32) {
        uint32 c = a + b;
        if (c < a) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint32 a, uint32 b) internal pure returns (bool, uint32) {
        if (b > a) return (false, 0);
        return (true, a - b);
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint32 a, uint32 b) internal pure returns (bool, uint32) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) return (true, 0);
        uint32 c = a * b;
        if (c / a != b) return (false, 0);
        return (true, c);
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint32 a, uint32 b) internal pure returns (bool, uint32) {
        if (b == 0) return (false, 0);
        return (true, a / b);
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint32 a, uint32 b) internal pure returns (bool, uint32) {
        if (b == 0) return (false, 0);
        return (true, a % b);
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint32 a, uint32 b) internal pure returns (uint32) {
        uint32 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint32 a, uint32 b) internal pure returns (uint32) {
        require(b <= a, "SafeMath: subtraction overflow");
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint32 a, uint32 b) internal pure returns (uint32) {
        if (a == 0) return 0;
        uint32 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint32 a, uint32 b) internal pure returns (uint32) {
        require(b > 0, "SafeMath: division by zero");
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint32 a, uint32 b) internal pure returns (uint32) {
        require(b > 0, "SafeMath: modulo by zero");
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint32 a, uint32 b, string memory errorMessage) internal pure returns (uint32) {
        require(b <= a, errorMessage);
        return a - b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryDiv}.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint32 a, uint32 b, string memory errorMessage) internal pure returns (uint32) {
        require(b > 0, errorMessage);
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint32 a, uint32 b, string memory errorMessage) internal pure returns (uint32) {
        require(b > 0, errorMessage);
        return a % b;
    }
}