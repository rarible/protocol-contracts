// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2 <0.8.0;
pragma abicoder v2;

import "./ERC721RaribleUser.sol";
import "./TokenProxy.sol";
import "@openzeppelin/contracts/proxy/IBeacon.sol";
import "@rarible/lazy-mint/contracts/erc-721/LibERC721LazyMint.sol";

contract ERC721Factory {

    IBeacon public beacon;

    event CreateProxy(TokenProxy proxy);

    constructor(IBeacon _beacon) {
        beacon = _beacon;
    }

    function createToken(string memory _name, string memory _symbol, string memory baseURI, string memory contractURI, address[] memory operators) external {
        TokenProxy tokenProxy = new TokenProxy(address(beacon), "");
        ERC721RaribleUser(tokenProxy.implementation()).__ERC721RaribleUser_init(_name, _symbol, baseURI, contractURI, operators);
        emit CreateProxy(tokenProxy);
    }

    function _mintAndTransfer(TokenProxy tokenProxy, LibERC721LazyMint.Mint721Data memory data, address to) public {
        ERC721RaribleUser(tokenProxy.implementation()).mintAndTransfer(data, to);
    }
}
