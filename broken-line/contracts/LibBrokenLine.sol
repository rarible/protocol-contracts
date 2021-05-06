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
            brokenLine.slopeChanges[cliffEnd] = brokenLine.slopeChanges[cliffEnd].add(safeInt(line.slope));
            period = period.add(cliff);
        }

        int mod = safeInt(line.bias.mod(line.slope));
        uint256 endPeriod = line.start.add(period);
        uint256 endPeriodMinus1 = endPeriod.sub(1);
        brokenLine.slopeChanges[endPeriodMinus1] = brokenLine.slopeChanges[endPeriodMinus1].sub(safeInt(line.slope)).add(mod);
        brokenLine.slopeChanges[endPeriod] = brokenLine.slopeChanges[endPeriod].sub(mod);
    }

    /*newPeriod  - период новый*/
    function changePeriod(
        BrokenLineDomain.BrokenLine storage brokenLine,
        BrokenLineDomain.Line memory oldLine,
        uint cliff,
        uint newPeriod,
        uint toTime)
    internal returns (uint){
        update(brokenLine, toTime);
        /*удалить, а на самом деле компенсировать старое*/
        uint oldPeriod = oldLine.bias.div(oldLine.slope);
        int mod = safeInt(oldLine.bias.mod(oldLine.slope));
        uint256 endPeriod = oldLine.start.add(oldPeriod).add(cliff);
        brokenLine.slopeChanges[endPeriod.sub(1)] = brokenLine.slopeChanges[endPeriod.sub(1)].add(safeInt(oldLine.slope)).sub(mod);
        brokenLine.slopeChanges[endPeriod] = brokenLine.slopeChanges[endPeriod].add(mod);
        /*вычислить новый slope and tail*/
        uint newSlope = oldLine.bias.div(newPeriod);
        mod = safeInt(brokenLine.initial.bias.mod(newSlope)); //при новомSlope, tail вычисляю из текущего bias
        /*вычислим точку завершения клифа*/
        uint cliffEnd = oldLine.start.add(cliff).sub(1);
        if (cliffEnd >= toTime){ //если клиф не завершен
            endPeriod = oldLine.start.add(newPeriod).add(cliff);//определим конечную точку
            /*в точке завершения клифа компенсировать изменение клифа на дельту = старыйКлиф-новыйКлиф*/
            brokenLine.slopeChanges[cliffEnd] = brokenLine.slopeChanges[cliffEnd].sub(safeInt(oldLine.slope.sub(newSlope)));
        } else{ //клиф кончился
            endPeriod = (brokenLine.initial.bias.div(newSlope)).add(toTime);//определим конечную точку
            /*изменим сам slope на дельту = старыйSlope-новыйSlope*/
            brokenLine.initial.slope = brokenLine.initial.slope.sub(uint(safeInt(oldLine.slope.sub(newSlope))));
        }
        brokenLine.slopeChanges[endPeriod.sub(1)] = brokenLine.slopeChanges[endPeriod.sub(1)].sub(safeInt(newSlope)).add(mod);
        brokenLine.slopeChanges[endPeriod] = brokenLine.slopeChanges[endPeriod].sub(mod);
        return newSlope;
    }

    /*newAmount  - amount изменился на величину*/
    function changeAmount(
        BrokenLineDomain.BrokenLine storage brokenLine,
        BrokenLineDomain.Line memory oldLine,
        uint cliff,
        uint newAmount,
        uint toTime)
    internal returns (uint) {
        update(brokenLine, toTime);
        uint period = oldLine.bias.div(oldLine.slope);
        int mod = safeInt(oldLine.bias.mod(oldLine.slope));
        uint256 endPeriod = oldLine.start.add(period).add(cliff);
        uint256 endPeriodMinus1 = endPeriod.sub(1);
        brokenLine.slopeChanges[endPeriodMinus1] = brokenLine.slopeChanges[endPeriodMinus1].add(safeInt(oldLine.slope)).sub(mod);
        brokenLine.slopeChanges[endPeriod] = brokenLine.slopeChanges[endPeriod].add(mod);

        uint newSlope = newAmount.div(period);
        mod = safeInt(newAmount.mod(newSlope));
        brokenLine.slopeChanges[endPeriodMinus1] = brokenLine.slopeChanges[endPeriodMinus1].sub(safeInt(newSlope)).add(mod);
        brokenLine.slopeChanges[endPeriod] = brokenLine.slopeChanges[endPeriod].sub(mod);

        uint cliffEnd = oldLine.start.add(cliff).sub(1);
        int deltaSlope = safeInt(newSlope.sub(oldLine.slope));
        if (cliffEnd > toTime){
            brokenLine.slopeChanges[cliffEnd] = brokenLine.slopeChanges[cliffEnd].add(deltaSlope);
        } else{
            brokenLine.initial.slope = brokenLine.initial.slope.add(uint(deltaSlope));
        }
        return newSlope;
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
            int newSlope = safeInt(slope).add(brokenLine.slopeChanges[time]);
            require (newSlope >= 0, "slope < 0, something wrong with slope");
            slope = uint(newSlope);
            brokenLine.slopeChanges[time] = 0;
            time = time.add(1);
        }
        brokenLine.initial.start = toTime;
        brokenLine.initial.bias = bias;
        brokenLine.initial.slope = slope;
    }

    function safeInt(uint value) internal returns (int result) {
        result = int(value);
        require(value == uint(result), "int cast error");
    }
}
