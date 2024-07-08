// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.7.6;

interface ITokenURIGenerator {
    function tokenURI(uint tokenId) external view returns (string memory);
}

abstract contract RenderingContract {
    ITokenURIGenerator public renderingContract;

    function setRenderingContract(ITokenURIGenerator _contract) external {
        renderingContract = _contract;
    }
}