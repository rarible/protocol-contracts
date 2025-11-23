// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/utils/Strings.sol";

contract MoonbirdsRenderer {

    function tokenURI(uint tokenId) external view returns (string memory) {
        return "";
    }

    function attributesJson(
        uint tokenId
    ) public view returns (string memory) {
        return "[{\"trait_type\":\"Background\",\"value\":\"Blue\"},{\"trait_type\":\"Beak\",\"value\":\"Short\"},{\"trait_type\":\"Body\",\"value\":\"Crescent\"},{\"trait_type\":\"Feathers\",\"value\":\"Purple\"},{\"trait_type\":\"Eyes\",\"value\":\"Open\"},{\"trait_type\":\"Headwear\",\"value\":\"Space Helmet\"}]";
    }

    function artworkUri(uint tokenId) public view returns (string memory) {
        return "";
    }

    function alternateArtworkUri(
        uint tokenId
    ) public view returns (string memory) {
        return string(abi.encodePacked("https://collection-assets.proof.xyz/moonbirds/images/", Strings.toString(tokenId), ".png"));
    }

    function animationUri(uint tokenId) public view returns (string memory) {
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

    function useNewArtwork(uint tokenId) external view returns (bool) {
        return true;
    }
}