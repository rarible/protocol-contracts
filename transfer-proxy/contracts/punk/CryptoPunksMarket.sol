// SPDX-License-Identifier: MIT
pragma solidity >=0.6.9 <0.8.0;

contract CryptoPunksMarket {

    // You can use this hash to verify the image file containing all the punks
    string public imageHash = "ac39af4793119ee46bbff351d8cb6b5f23da60222126add4268e261199a2921b";

    address owner;

    string public standard = 'CryptoPunks';
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    uint public nextPunkIndexToAssign = 0;

    bool public allPunksAssigned = false;
    uint public punksRemainingToAssign = 0;

    //mapping (address => uint) public addressToPunkIndex;
    mapping (uint => address) public punkIndexToAddress;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;

    struct Offer {
        bool isForSale;
        uint punkIndex;
        address seller;
        uint minValue;          // in ether
        address onlySellTo;     // specify to sell only to a specific person
    }

    struct Bid {
        bool hasBid;
        uint punkIndex;
        address bidder;
        uint value;
    }

    // A record of punks that are offered for sale at a specific minimum value, and perhaps to a specific person
    mapping (uint => Offer) public punksOfferedForSale;

    // A record of the highest punk bid
    mapping (uint => Bid) public punkBids;

    mapping (address => uint) public pendingWithdrawals;

    event Assign(address indexed to, uint256 punkIndex);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event PunkTransfer(address indexed from, address indexed to, uint256 punkIndex);
    event PunkOffered(uint indexed punkIndex, uint minValue, address indexed toAddress);
    event PunkBidEntered(uint indexed punkIndex, uint value, address indexed fromAddress);
    event PunkBidWithdrawn(uint indexed punkIndex, uint value, address indexed fromAddress);
    event PunkBought(uint indexed punkIndex, uint value, address indexed fromAddress, address indexed toAddress);
    event PunkNoLongerForSale(uint indexed punkIndex);

    /* Initializes contract with initial supply tokens to the creator of the contract */
//sks    function CryptoPunksMarket() payable {
    constructor() {
        //        balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
        owner = msg.sender;
        totalSupply = 10000;                        // Update total supply
        punksRemainingToAssign = totalSupply;
        name = "CRYPTOPUNKS";                                   // Set the name for display purposes
//sks        symbol = "Ͼ";                               // Set the symbol for display purposes
        symbol = "C";                               // Set the symbol for display purposes
        decimals = 0;                                       // Amount of decimals for display purposes
    }

    function setInitialOwner(address to, uint punkIndex) internal {
//        if (msg.sender != owner) throw;
        require(msg.sender == owner, "This function is restricted to the contract's owner");
//        if (allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
        if (punkIndexToAddress[punkIndex] != to) {
            if (punkIndexToAddress[punkIndex] != address(0x0)) {
                balanceOf[punkIndexToAddress[punkIndex]]--;
            } else {
                punksRemainingToAssign--;
            }
            punkIndexToAddress[punkIndex] = to;
            balanceOf[to]++;
            emit Assign(to, punkIndex);
        }
    }

    function setInitialOwners(address[] memory addresses, uint[] memory indices) external {
//        if (msg.sender != owner) throw;
        require(msg.sender == owner, "This function is restricted to the contract's owner");
        uint n = addresses.length;
        for (uint i = 0; i < n; i++) {
            setInitialOwner(addresses[i], indices[i]);
        }
    }

    function allInitialOwnersAssigned() external {
//        if (msg.sender != owner) throw;
        require(msg.sender == owner, "This function is restricted to the contract's owner");
        allPunksAssigned = true;
    }

    function getPunk(uint punkIndex) external {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
//        if (punksRemainingToAssign == 0) throw;
        require(punksRemainingToAssign != 0, "No remain to assign");
//        if (punkIndexToAddress[punkIndex] != 0x0) throw;
        require(punkIndexToAddress[punkIndex] == address(0x0), "Unnecessary address");
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
        punkIndexToAddress[punkIndex] = msg.sender;
        balanceOf[msg.sender]++;
        punksRemainingToAssign--;
        emit Assign(msg.sender, punkIndex);
    }

    // Transfer ownership of a punk to another user without requiring payment
    function transferPunk(address to, uint punkIndex) external {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
        //        if (punkIndexToAddress[punkIndex] != 0x0) throw;
        require(punkIndexToAddress[punkIndex] == address(0x0), "Unnecessary address");
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
        if (punksOfferedForSale[punkIndex].isForSale) {
            punkNoLongerForSale(punkIndex);
        }
        punkIndexToAddress[punkIndex] = to;
        balanceOf[msg.sender]--;
        balanceOf[to]++;
        emit Transfer(msg.sender, to, 1);
        emit PunkTransfer(msg.sender, to, punkIndex);
        // Check for the case where there is a bid from the new owner and refund it.
        // Any other bid can stay in place.
        Bid memory bid = punkBids[punkIndex];
        if (bid.bidder == to) {
            // Kill bid and refund value
            pendingWithdrawals[to] += bid.value;
            punkBids[punkIndex] = Bid(false, punkIndex, address(0x0), 0);
        }
    }

    function punkNoLongerForSale(uint punkIndex) internal {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
//        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        require(punkIndexToAddress[punkIndex] == msg.sender, "Unnecessary address");
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
        punksOfferedForSale[punkIndex] = Offer(false, punkIndex, msg.sender, 0, address(0x0));
        emit PunkNoLongerForSale(punkIndex);
    }

    function offerPunkForSale(uint punkIndex, uint minSalePriceInWei) external {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
//        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        require(punkIndexToAddress[punkIndex] == msg.sender, "Unnecessary address");
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
        punksOfferedForSale[punkIndex] = Offer(true, punkIndex, msg.sender, minSalePriceInWei, address(0x0));
        PunkOffered(punkIndex, minSalePriceInWei, address(0x0));
    }

    function offerPunkForSaleToAddress(uint punkIndex, uint minSalePriceInWei, address toAddress) external {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
//        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
        require(punkIndexToAddress[punkIndex] == msg.sender, "Unnecessary address");
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
        punksOfferedForSale[punkIndex] = Offer(true, punkIndex, msg.sender, minSalePriceInWei, toAddress);
        emit PunkOffered(punkIndex, minSalePriceInWei, toAddress);
    }

    function buyPunk(uint punkIndex) payable external {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
        Offer memory offer = punksOfferedForSale[punkIndex];
//        if (punkIndex >= 10000) throw;
        require(punkIndex <= 10000, "Unnecessary punkIndex value");
//        if (!offer.isForSale) throw;                // punk not actually for sale
        require(offer.isForSale == true, "Offer not for sale");
        if (offer.onlySellTo != address(0x0) && offer.onlySellTo != msg.sender) {revert("SellTo error");}  // punk not supposed to be sold to this user
        if (msg.value < offer.minValue) {revert("Price Error");}     // Didn't send enough ETH
        if (offer.seller != punkIndexToAddress[punkIndex]) {revert("Seller address error");} // Seller no longer owner of punk

        address seller = offer.seller;

        punkIndexToAddress[punkIndex] = msg.sender;
        balanceOf[seller]--;
        balanceOf[msg.sender]++;
        emit Transfer(seller, msg.sender, 1);

        punkNoLongerForSale(punkIndex);
        pendingWithdrawals[seller] += msg.value;
        emit PunkBought(punkIndex, msg.value, seller, msg.sender);
//        revert("PunkBought_sks_Test");
        // Check for the case where there is a bid from the new owner and refund it.
        // Any other bid can stay in place.
        Bid memory bid = punkBids[punkIndex];
        if (bid.bidder == msg.sender) {
            // Kill bid and refund value
            pendingWithdrawals[msg.sender] += bid.value;
            punkBids[punkIndex] = Bid(false, punkIndex, address(0x0), 0);
        }
    }

    function withdraw() external {
//        if (!allPunksAssigned) throw;
        require(allPunksAssigned == true, "Not assigned punk detected");
        uint amount = pendingWithdrawals[msg.sender];
        // Remember to zero the pending refund before
        // sending to prevent re-entrancy attacks
        pendingWithdrawals[msg.sender] = 0;
        msg.sender.transfer(amount);
    }

//    function enterBidForPunk(uint punkIndex) external payable {
//        if (punkIndex >= 10000) throw;
//        if (!allPunksAssigned) throw;
//        if (punkIndexToAddress[punkIndex] == 0x0) throw;
//        if (punkIndexToAddress[punkIndex] == msg.sender) throw;
//        if (msg.value == 0) throw;
//        Bid existing = punkBids[punkIndex];
//        if (msg.value <= existing.value) throw;
//        if (existing.value > 0) {
//            // Refund the failing bid
//            pendingWithdrawals[existing.bidder] += existing.value;
//        }
//        punkBids[punkIndex] = Bid(true, punkIndex, msg.sender, msg.value);
//        PunkBidEntered(punkIndex, msg.value, msg.sender);
//    }
//
//    function acceptBidForPunk(uint punkIndex, uint minPrice) {
//        if (punkIndex >= 10000) throw;
//        if (!allPunksAssigned) throw;
//        if (punkIndexToAddress[punkIndex] != msg.sender) throw;
//        address seller = msg.sender;
//        Bid bid = punkBids[punkIndex];
//        if (bid.value == 0) throw;
//        if (bid.value < minPrice) throw;
//
//        punkIndexToAddress[punkIndex] = bid.bidder;
//        balanceOf[seller]--;
//        balanceOf[bid.bidder]++;
//        Transfer(seller, bid.bidder, 1);
//
//        punksOfferedForSale[punkIndex] = Offer(false, punkIndex, bid.bidder, 0, 0x0);
//        uint amount = bid.value;
//        punkBids[punkIndex] = Bid(false, punkIndex, 0x0, 0);
//        pendingWithdrawals[seller] += amount;
//        PunkBought(punkIndex, bid.value, seller, bid.bidder);
//    }
//
//    function withdrawBidForPunk(uint punkIndex) {
//        if (punkIndex >= 10000) throw;
//        if (!allPunksAssigned) throw;
//        if (punkIndexToAddress[punkIndex] == 0x0) throw;
//        if (punkIndexToAddress[punkIndex] == msg.sender) throw;
//        Bid bid = punkBids[punkIndex];
//        if (bid.bidder != msg.sender) throw;
//        PunkBidWithdrawn(punkIndex, bid.value, msg.sender);
//        uint amount = bid.value;
//        punkBids[punkIndex] = Bid(false, punkIndex, 0x0, 0);
//        // Refund the bid money
//        msg.sender.transfer(amount);
//    }

}