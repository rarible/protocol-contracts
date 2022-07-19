// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;
pragma abicoder v2;

library LibSeaPort {
     /**
     * @dev The full set of order components, with the exception of the counter,
     *      must be supplied when fulfilling more sophisticated orders or groups of
     *      orders. The total number of original consideration items must also be
     *      supplied, as the caller may specify additional consideration items.
     */
    struct OrderParameters {
        address offerer; // 0x00
        address zone; // 0x20
        OfferItem[] offer; // 0x40
        ConsiderationItem[] consideration; // 0x60
        OrderType orderType; // 0x80
        uint256 startTime; // 0xa0
        uint256 endTime; // 0xc0
        bytes32 zoneHash; // 0xe0
        uint256 salt; // 0x100
        bytes32 conduitKey; // 0x120
        uint256 totalOriginalConsiderationItems; // 0x140
        // offer.length                          // 0x160
    }

    /**
     * @dev Orders require a signature in addition to the other order parameters.
     */
    struct Order {
        OrderParameters parameters;
        bytes signature;
    }

    struct AdvancedOrder {
        OrderParameters parameters;
        uint120 numerator;
        uint120 denominator;
        bytes signature;
        bytes extraData;
    }

    struct OfferItem {
        ItemType itemType;
        address token;
        uint256 identifierOrCriteria;
        uint256 startAmount;
        uint256 endAmount;
    }

    /**
     * @dev A consideration item has the same five components as an offer item and
     *      an additional sixth component designating the required recipient of the
     *      item.
     */
    struct ConsiderationItem {
        ItemType itemType;
        address token;
        uint256 identifierOrCriteria;
        uint256 startAmount;
        uint256 endAmount;
        address payable recipient;
    }

    // prettier-ignore
    enum OrderType {
        // 0: no partial fills, anyone can execute
        FULL_OPEN,

        // 1: partial fills supported, anyone can execute
        PARTIAL_OPEN,

        // 2: no partial fills, only offerer or zone can execute
        FULL_RESTRICTED,

        // 3: partial fills supported, only offerer or zone can execute
        PARTIAL_RESTRICTED
    }

    // prettier-ignore
    enum ItemType {
        // 0: ETH on mainnet, MATIC on polygon, etc.
        NATIVE,

        // 1: ERC20 items (ERC777 and ERC20 analogues could also technically work)
        ERC20,

        // 2: ERC721 items
        ERC721,

        // 3: ERC1155 items
        ERC1155,

        // 4: ERC721 items where a number of tokenIds are supported
        ERC721_WITH_CRITERIA,

        // 5: ERC1155 items where a number of ids are supported
        ERC1155_WITH_CRITERIA
    }

    /**
     * @dev A fulfillment is applied to a group of orders. It decrements a series of
     *      offer and consideration items, then generates a single execution
     *      element. A given fulfillment can be applied to as many offer and
     *      consideration items as desired, but must contain at least one offer and
     *      at least one consideration that match. The fulfillment must also remain
     *      consistent on all key parameters across all offer items (same offerer,
     *      token, type, tokenId, and conduit preference) as well as across all
     *      consideration items (token, type, tokenId, and recipient).
     */
    struct Fulfillment {
        FulfillmentComponent[] offerComponents;
        FulfillmentComponent[] considerationComponents;
    }

    /**
     * @dev Each fulfillment component contains one index referencing a specific
     *      order and another referencing a specific offer or consideration item.
     */
    struct FulfillmentComponent {
        uint256 orderIndex;
        uint256 itemIndex;
    }

    /**
     * @dev An execution is triggered once all consideration items have been zeroed
     *      out. It sends the item in question from the offerer to the item's
     *      recipient, optionally sourcing approvals from either this contract
     *      directly or from the offerer's chosen conduit if one is specified. An
     *      execution is not provided as an argument, but rather is derived via
     *      orders, criteria resolvers, and fulfillments (where the total number of
     *      executions will be less than or equal to the total number of indicated
     *      fulfillments) and returned as part of `matchOrders`.
     */
    struct Execution {
        ReceivedItem item;
        address offerer;
        bytes32 conduitKey;
    }

    /**
 * @dev A received item is translated from a utilized consideration item and has
 *      the same four components as a spent item, as well as an additional fifth
 *      component designating the required recipient of the item.
 */
    struct ReceivedItem {
        ItemType itemType;
        address token;
        uint256 identifier;
        uint256 amount;
        address payable recipient;
    }

    struct CriteriaResolver {
        uint256 orderIndex;
        Side side;
        uint256 index;
        uint256 identifier;
        bytes32[] criteriaProof;
    }

    // prettier-ignore
    enum Side {
        // 0: Items that can be spent
        OFFER,

        // 1: Items that must be received
        CONSIDERATION
    }
}
