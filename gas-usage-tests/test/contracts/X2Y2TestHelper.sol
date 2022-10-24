// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

contract X2Y2TestHelper {

    struct Pair721 {
        address token;
        uint256 tokenId;
    }

    struct Pair1155 {
        address token;
        uint256 tokenId;
        uint256 amount;
    }

    struct OrderItem {
        uint256 price;
        bytes data;
    }

    struct Order {
        uint256 salt;
        address user;
        uint256 network;
        uint256 intent;
        uint256 delegateType;
        uint256 deadline;
        address currency;
        bytes dataMask;
        OrderItem[] items;
        // signature
        bytes32 r;
        bytes32 s;
        uint8 v;
        uint8 signVersion;
    }


    function encodeData(Pair721[] calldata data) external pure returns(bytes memory){
        return abi.encode(data);
    }

    function encodeData1155(Pair1155[] calldata data) external pure returns(bytes memory){
        return abi.encode(data);
    }

    function hashItem(Order memory order, OrderItem memory item)
        external
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    order.salt,
                    order.user,
                    order.network,
                    order.intent,
                    order.delegateType,
                    order.deadline,
                    order.currency,
                    order.dataMask,
                    item
                )
            );
    }

    
}
