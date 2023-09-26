// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Holder.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";

contract NFTLottery is ERC721Holder {
    using SafeMathUpgradeable for uint;

    /// @dev struct with Lottery data
    struct Lottery {
        address token;
        uint256 tokenId;
        uint256 price;
        uint256 amountOfTikectsNeeded;
        uint256 amountOfTikectsBought;
        address seller;
    }

    /// @dev mapping that stores data 
    mapping (uint256 => Lottery) public lotteries;

    mapping (uint256 => address[]) buyers;

    /// @dev latest lotteryId
    uint256 public lotteryId = 1;

    event LotteryCreated(uint indexed lotteryId, address token, uint256 tokenId, uint256 price, uint256 amountOfTickets, address seller);
    event TicketsBought(uint indexed lotteryId, address buyer, uint256 moneyPaid, uint256 ticketsLeft);
    event LotteryFinalised(uint indexed lotteryId, address winner, uint256 moneyPaid);

    /// @dev increments lotteryId and returns new value
    function getNextAndIncrementLotteryId() internal returns (uint256) {
        return lotteryId++;
    }

    function startLottery(address token, uint256 tokenId, uint256 price, uint256 amountOfTikects) external returns(uint256){
        uint256 currentLotteryId = getNextAndIncrementLotteryId();
        address seller = msg.sender;

        lotteries[currentLotteryId] = Lottery(
            token,
            tokenId,
            price,
            amountOfTikects,
            0,
            seller
        );

        transferNFT(token, tokenId, seller, address(this));

        emit LotteryCreated(currentLotteryId, token, tokenId, price, amountOfTikects, seller);
        
        return currentLotteryId;
    }

    function buyTikects(uint256 _lotteryId, uint256 amountOfTicketsToBuy) external payable {
        Lottery memory lottery = lotteries[_lotteryId];
        uint msgValue = msg.value;
        address buyer = msg.sender;

        require(lottery.seller != address(0), "lottery doesn't exist");
        require(msgValue == (getTicketPrice(lottery).mul(amountOfTicketsToBuy)), "wrong amount of money sent");

        uint256 ticketsLeft = howManyTicketsLeft(lottery, amountOfTicketsToBuy);

        lotteries[_lotteryId].amountOfTikectsBought = lottery.amountOfTikectsBought.add(amountOfTicketsToBuy);

        for (uint i = 0; i < amountOfTicketsToBuy; i++) {
            buyers[_lotteryId].push(buyer);
        }
        emit TicketsBought(_lotteryId, buyer, msgValue, ticketsLeft);
    }

    function getTicketPrice(Lottery memory lottery) internal pure returns(uint256) {
        return lottery.price.div(lottery.amountOfTikectsNeeded);
    }

    function transferNFT(address token, uint256 tokenId, address from, address to) internal {
        IERC721Upgradeable(token).safeTransferFrom(from, to, tokenId);
    }

    function howManyTicketsLeft(Lottery memory lottery, uint256 amountOfTicketsToBuy) internal pure returns(uint256) {
        return lottery.amountOfTikectsNeeded.sub(lottery.amountOfTikectsBought.add(amountOfTicketsToBuy));
    }

    function finaliseLottery(uint256 _lotteryId) external {
        Lottery memory lottery = lotteries[_lotteryId];

        require(lottery.seller == msg.sender, "can only be called by seller");
        require(howManyTicketsLeft(lottery, 0) == 0, "still there are some tickets left to buy");
        require(buyers[_lotteryId].length == lottery.amountOfTikectsNeeded, "still there are some tickets left to buy 2");

        //getting the winner
        address winner = getWinner(_lotteryId, lottery);

        //transferring the NFT to the winner
        transferNFT(lottery.token, lottery.tokenId, address(this), winner);

        //transferring money to the seller
        transferEth(lottery.seller, lottery.price);

        emit LotteryFinalised(_lotteryId, winner, lottery.price);
    }

    function getWinner(uint256 _lotteryId, Lottery memory lottery) internal view returns(address) {
        uint256 index = uint(keccak256(abi.encodePacked(lottery.token, lottery.tokenId, lottery.seller, block.timestamp, block.number, block.difficulty))) % lottery.amountOfTikectsNeeded;
        return buyers[_lotteryId][index];
    }

    function getBuyers(uint256 _lotteryId) external view returns(address[] memory) {
        return buyers[_lotteryId];
    }

    function transferEth(address to, uint value) internal {
        (bool success,) = to.call{ value: value }("");
        require(success, "transfer failed");
    }

    /// @dev method that return how many tickets left in the lottery
    function getTicketsLeft(uint256 _lotteryId) external view returns(uint256) {
        return howManyTicketsLeft(lotteries[_lotteryId], 0);
    }

    /// @dev method that returns bool if lottery is finalised
    function isLotteryFinalised(uint256 _lotteryId) external view returns(bool) {
        return (howManyTicketsLeft(lotteries[_lotteryId], 0) == 0) ? true : false;
    }

}