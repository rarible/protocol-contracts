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

library BrokenLineLibrary {
    using SignedSafeMathUpgradeable for int;
    using SafeMathUpgradeable for uint;

    function add(BrokenLineDomain.BrokenLine storage brokenLine, BrokenLineDomain.Line memory line) internal {
        update(brokenLine, line.start);
        brokenLine.initial.bias = brokenLine.initial.bias.add(line.bias);
        brokenLine.initial.slope = brokenLine.initial.slope.add(line.slope);

        uint period = line.bias.div(line.slope);
        fixChanges(brokenLine, line, period);
    }

    function add(BrokenLineDomain.BrokenLine storage brokenLine, BrokenLineDomain.Line memory line, uint cliff) internal {
        update(brokenLine, line.start);
        brokenLine.initial.bias = brokenLine.initial.bias.add(line.bias);
        uint period = line.bias.div(line.slope);
        if (cliff == 0) {
            brokenLine.initial.slope = brokenLine.initial.slope.add(line.slope);
        } else {
            brokenLine.slopeChanges[cliff] = brokenLine.slopeChanges[cliff].add(int(line.slope));
            period = period.add(cliff);
        }

        fixChanges(brokenLine, line, period);
    }

    function fixChanges(BrokenLineDomain.BrokenLine storage brokenLine, BrokenLineDomain.Line memory line, uint period ) internal {
        uint mod = line.bias.mod(line.slope);
        brokenLine.slopeChanges[line.start.add(period).sub(1)] = brokenLine.slopeChanges[line.start.add(period).sub(1)].add(int(line.slope.sub(mod)).mul(-1));
        brokenLine.slopeChanges[line.start.add(period)] = brokenLine.slopeChanges[line.start.add(period)].add(int(mod).mul(-1));
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
            require (slope >= 0, "slope < 0, something wrong");
            bias = bias.sub(slope);
            slope = uint(int(slope).add(brokenLine.slopeChanges[time]));
            brokenLine.slopeChanges[time] = 0;
            time = time.add(1);
        }
        brokenLine.initial.start = toTime;
        brokenLine.initial.bias = bias;
        brokenLine.initial.slope = slope;
    }

}
