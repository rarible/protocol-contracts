// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title MockVRFCoordinator
/// @notice Mock Chainlink VRF Coordinator for testing PackManager
contract MockVRFCoordinator {
    uint256 private _nextRequestId = 1;

    /// @dev Stores callback addresses for each request
    mapping(uint256 => address) public requestCallbacks;

    event RandomWordsRequested(
        uint256 indexed requestId,
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );

    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords, address indexed callback);

    /// @notice Mock requestRandomWords function matching VRF V2 signature (uint64 subId)
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256 requestId) {
        requestId = _nextRequestId++;
        requestCallbacks[requestId] = msg.sender;

        emit RandomWordsRequested(
            requestId,
            keyHash,
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
    }

    /// @notice Fulfill a random words request with specified random values
    /// @dev Call this from tests to simulate VRF callback
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        address callback = requestCallbacks[requestId];
        require(callback != address(0), "MockVRF: request not found");

        // Call rawFulfillRandomWords on the callback contract
        (bool success, ) = callback.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "MockVRF: callback failed");

        emit RandomWordsFulfilled(requestId, randomWords, callback);
    }

    /// @notice Fulfill with deterministic random values based on seed
    /// @dev Useful for predictable testing
    function fulfillRandomWordsWithSeed(uint256 requestId, uint256 seed, uint32 numWords) external {
        uint256[] memory randomWords = new uint256[](numWords);
        for (uint32 i = 0; i < numWords; i++) {
            randomWords[i] = uint256(keccak256(abi.encodePacked(seed, i)));
        }

        address callback = requestCallbacks[requestId];
        require(callback != address(0), "MockVRF: request not found");

        (bool success, ) = callback.call(
            abi.encodeWithSignature("rawFulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );
        require(success, "MockVRF: callback failed");

        emit RandomWordsFulfilled(requestId, randomWords, callback);
    }

    /// @notice Get the next request ID that will be assigned
    function nextRequestId() external view returns (uint256) {
        return _nextRequestId;
    }
}
