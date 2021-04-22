// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/math/SignedSafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

/**
  * Line описывает линейную функцию, как убывает голос юзера. от точки (start, bias) со скоростью slope
  * BrokenLine - кривая, которая описывает кривую изменения суммы голосов нескольких пользователей
  * Эта кривая начинается с прямой (Line) и потом, в каждый момент времени наклон может быть изменен.
  * Все изменения наклона хранятся в slopeChanges. Наклон всегда может быть уменьшен только, увеличиваться он не может,
  * потому что у юзеров могут только заканчиваться периоды локапа.
  **/
//todo подумать про типы, нужна ли максимальная точность
contract BrokenLineDomain {
    struct Line {
        uint start;
        uint bias;
        uint slope;
    }

    struct BrokenLine {
        mapping (uint => int) slopeChanges; //change of slope applies to the next time point
        Line initial;
    }
}

library LibBrokenLine {
    using SignedSafeMathUpgradeable for int;
    using SafeMathUpgradeable for uint;

    function add(BrokenLineDomain.BrokenLine storage brokenLine, BrokenLineDomain.Line memory line, uint cliff) internal {
        update(brokenLine, line.start);
        brokenLine.initial.bias = brokenLine.initial.bias.add(line.bias);
        uint period = line.bias.div(line.slope);
        if (cliff == 0) {
            brokenLine.initial.slope = brokenLine.initial.slope.add(line.slope);
        } else {
            uint cliffEnd = line.start.add(cliff).sub(1);
            brokenLine.slopeChanges[cliffEnd] = brokenLine.slopeChanges[cliffEnd].add(int(line.slope));
            period = period.add(cliff);
        }

        uint mod = line.bias.mod(line.slope);
        brokenLine.slopeChanges[line.start.add(period).sub(1)] = brokenLine.slopeChanges[line.start.add(period).sub(1)].add(negate(line.slope.sub(mod)));
        brokenLine.slopeChanges[line.start.add(period)] = brokenLine.slopeChanges[line.start.add(period)].add(negate(mod));
    }

    /**
     * Обновляет initial линию для переданного time. Высчитывает и применяет все изменения из slopeChanges за этот период
    **/
    function update(BrokenLineDomain.BrokenLine storage brokenLine, uint toTime) internal {
        uint bias = brokenLine.initial.bias;
        uint slope = brokenLine.initial.slope;
        uint time = brokenLine.initial.start;
        require(toTime >= time, "can't update BrokenLine for past time");
        while (time < toTime) {
            bias = bias.sub(slope);
            int newSlope = int(slope).add(brokenLine.slopeChanges[time]);
            require (newSlope >= 0, "slope < 0, something wrong with slope");
            slope = uint(newSlope);
            brokenLine.slopeChanges[time] = 0;
            time = time.add(1);
        }
        brokenLine.initial.start = toTime;
        brokenLine.initial.bias = bias;
        brokenLine.initial.slope = slope;
    }

    function negate(uint value) pure internal returns (int) {
        return int(value) * -1;
    }
}
