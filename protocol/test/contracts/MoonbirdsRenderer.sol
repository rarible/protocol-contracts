// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/Strings.sol";

contract MoonbirdsRenderer {
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        return "";
    }

    function attributesJson(uint256 tokenId) public view returns (string memory) {
        return
            "[{'trait_type':'Background','value':'Blue'},{'trait_type':'Beak','value':'Short'},{'trait_type':'Body','value':'Crescent'},{'trait_type':'Feathers','value':'Purple'},{'trait_type':'Eyes','value':'Open'},{'trait_type':'Headwear','value':'Space Helmet'}]";
    }

    function artworkUri(uint256 tokenId) public view returns (string memory) {
        return "";
    }

    function alternateArtworkUri(uint256 tokenId) public view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://collection-assets.proof.xyz/moonbirds/images/",
                    Strings.toString(tokenId),
                    ".png"
                )
            );
    }

    function animationUri(uint256 tokenId) public view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://collection-assets.proof.xyz/moonbirds/embed.html",
                    "?tokenId=",
                    Strings.toString(tokenId),
                    "&useNewArtwork=true"
                )
            );
    }

    function useNewArtwork(uint256 tokenId) external view returns (bool) {
        return true;
    }
}
