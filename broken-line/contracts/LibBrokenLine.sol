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

    struct Line {           //line
        uint start;
        uint bias;
        uint slope;
    }

    struct LineData {       //all data about line
        Line line;
        uint cliff;
    }

    struct BrokenLine {
        mapping (uint => int) slopeChanges;         //change of slope applies to the next time point
        mapping (uint => LineData) initiatedLines;  //initiated (successfully added) Lines
        Line initial;
        uint id;                                    //id Line, successfully added to BrokenLine
    }
}

library LibBrokenLine {
    using SignedSafeMathUpgradeable for int;
    using SafeMathUpgradeable for uint;

    /*add Line, save data in LineData*/
    function add(BrokenLineDomain.BrokenLine storage brokenLine, BrokenLineDomain.Line memory line, uint cliff) internal returns (uint) {
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

        BrokenLineDomain.LineData memory lineData;
        lineData.line = line;
        lineData.cliff = cliff;
        brokenLine.id++;
        brokenLine.initiatedLines[brokenLine.id] = lineData;
        return brokenLine.id;
    }

    /*remove Line from BrokenLine, return line.bias, which actual now moment */
    function remove(BrokenLineDomain.BrokenLine storage brokenLine, uint id, uint toTime) internal returns (uint) {
        if (brokenLine.initiatedLines[id].line.bias == 0) {
            return 0;
        }
        update(brokenLine, toTime);
        /*проверить может время закончилось*/
        uint period = brokenLine.initiatedLines[id].line.bias.div(brokenLine.initiatedLines[id].line.slope);
        uint finishTime = brokenLine.initiatedLines[id].line.start.add(period).add(brokenLine.initiatedLines[id].cliff);
        if (toTime > finishTime) {
            brokenLine.initiatedLines[id].line.bias = 0;
            return 0;
        }
        uint finishTimeMinusOne = finishTime.sub(1);
        int mod = safeInt(brokenLine.initiatedLines[id].line.bias.mod(brokenLine.initiatedLines[id].line.slope));
        uint nowBias = brokenLine.initiatedLines[id].line.bias;
        uint cliffEnd =  brokenLine.initiatedLines[id].line.start.add(brokenLine.initiatedLines[id].cliff).sub(1);
        if (toTime <= cliffEnd) { //если клиф не завершен
            /*в точке завершения клифа компенсировать изменение slope на oldLine.slope*/
            brokenLine.slopeChanges[cliffEnd] = brokenLine.slopeChanges[cliffEnd].sub(safeInt(brokenLine.initiatedLines[id].line.slope));
            /*в  новой точке завершения записать oldLine.slope*/
            brokenLine.slopeChanges[finishTimeMinusOne] = brokenLine.slopeChanges[finishTimeMinusOne].add(safeInt(brokenLine.initiatedLines[id].line.slope)).sub(mod);
        } else { //клиф кончился
            if (toTime <= finishTimeMinusOne) { //tail работает
                /*в  новой точке завершения клиф записать oldLine.slope*/
                brokenLine.initial.slope = brokenLine.initial.slope.sub(brokenLine.initiatedLines[id].line.slope); //меняем slope
                /*в  новой точке завершения записать oldLine.slope*/
                brokenLine.slopeChanges[finishTimeMinusOne] = brokenLine.slopeChanges[finishTimeMinusOne].add(safeInt(brokenLine.initiatedLines[id].line.slope)).sub(mod);
                nowBias = (finishTime.sub(toTime)).mul(brokenLine.initiatedLines[id].line.slope).add(uint(mod));
            } else {  //в точке tail brokenLine.initial.slope может быть меньше oldLine.slope
                brokenLine.initial.slope = brokenLine.initial.slope.sub(uint(mod));
                nowBias =uint(mod);
            }
        }
        brokenLine.slopeChanges[finishTime] = brokenLine.slopeChanges[finishTime].add(mod);
        brokenLine.initial.bias = brokenLine.initial.bias.sub(nowBias);
        brokenLine.initiatedLines[id].line.bias = 0;
        return nowBias;
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
