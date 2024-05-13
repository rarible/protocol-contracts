// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

import "@rarible/transfer-manager/contracts/lib/LibTransfer.sol";
import "@rarible/lib-bp/contracts/BpLibrary.sol";
import "@rarible/lib-part/contracts/LibPart.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

import "./interfaces/IWyvernExchange.sol";
import "./interfaces/IExchangeV2.sol";
import "./interfaces/ISeaPort.sol";
import "./interfaces/Ix2y2.sol";
import "./interfaces/ILooksRare.sol";
import "./interfaces/IBlur.sol";

import "./libraries/IsPausable.sol";
import "./AbstractRaribleExchangeWrapper.sol";

contract MutableRaribleExchangeWrapper is AbstractRaribleExchangeWrapper {

    address private _wyvernExchange;
    address private _exchangeV2;
    address private _seaPort_1_1;
    address private _x2y2;
    address private _looksRare;
    address private _sudoswap;
    address private _seaPort_1_4;
    address private _looksRareV2;
    address private _blur;
    address private _seaPort_1_5;
    address private _seaPort_1_6;
    address private _weth;

    constructor(address initialOwner) {
        transferOwnership(initialOwner);
    }

    // Getters
    function wyvernExchange() public view override returns(address) {
        return _wyvernExchange;
    }

    function exchangeV2() public view override returns(address) {
        return _exchangeV2;
    }

    function seaPort_1_1() public view override returns(address) {
        return _seaPort_1_1;
    }

    function x2y2() public view override returns(address) {
        return _x2y2;
    }

    function looksRare() public view override returns(address) {
        return _looksRare;
    }

    function sudoswap() public view override returns(address) {
        return _sudoswap;
    }

    function seaPort_1_4() public view override returns(address) {
        return _seaPort_1_4;
    }

    function looksRareV2() public view override returns(address) {
        return _looksRareV2;
    }

    function blur() public view override returns(address) {
        return _blur;
    }

    function seaPort_1_5() public view override returns(address) {
        return _seaPort_1_5;
    }

    function seaPort_1_6() public view override returns(address) {
        return _seaPort_1_6;
    }

    function weth() public view override returns(address) {
        return _weth;
    }

    // Setters
    function setWyvernExchange(address newAddress) public onlyOwner {
        _wyvernExchange = newAddress;
    }

    function setExchangeV2(address newAddress) public onlyOwner {
        _exchangeV2 = newAddress;
    }

    function setSeaPort_1_1(address newAddress) public onlyOwner {
        _seaPort_1_1 = newAddress;
    }

    function setX2y2(address newAddress) public onlyOwner {
        _x2y2 = newAddress;
    }

    function setLooksRare(address newAddress) public onlyOwner {
        _looksRare = newAddress;
    }

    function setSudoswap(address newAddress) public onlyOwner {
        _sudoswap = newAddress;
    }

    function setSeaPort_1_4(address newAddress) public onlyOwner {
        _seaPort_1_4 = newAddress;
    }

    function setLooksRareV2(address newAddress) public onlyOwner {
        _looksRareV2 = newAddress;
    }

    function setBlur(address newAddress) public onlyOwner {
        _blur = newAddress;
    }

    function setSeaPort_1_5(address newAddress) public onlyOwner {
        _seaPort_1_5 = newAddress;
    }

    function setSeaPort_1_6(address newAddress) public onlyOwner {
        _seaPort_1_6 = newAddress;
    }

    function setWeth(address newAddress) public onlyOwner {
        _weth = newAddress;
    }
}