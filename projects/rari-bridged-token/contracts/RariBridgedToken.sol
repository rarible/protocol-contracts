// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IArbToken} from "@arbitrum/token-bridge-contracts/contracts/tokenbridge/arbitrum/IArbToken.sol";

/**
 * @title Interface needed to call function registerTokenToL2 of the L1CustomGateway
 */
interface IL1CustomGateway {
    function registerTokenToL2(address _l2Address, uint256 _maxGas, uint256 _gasPriceBid, uint256 _maxSubmissionCost, address _creditBackAddress) external payable returns (uint256);
}

/**
 * @title Interface needed to call function setGateway of the L2GatewayRouter
 */
interface IL2GatewayRouter {
    function setGateway(address _gateway, uint256 _maxGas, uint256 _gasPriceBid, uint256 _maxSubmissionCost, address _creditBackAddress) external payable returns (uint256);
}

contract RariBridgedToken is IArbToken, AccessControlUpgradeable, ERC20VotesUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    IERC20 private _previous;
    address private _l1;
    address private _customGateway;
    address private _router;

    function __RariBridgedToken_init(IERC20 previousToken, address adminAddress, address minterAddress, address l1, address customGatewayAddress, address routerAddress) external initializer {
        __Context_init();
        __EIP712_init("RARI", "1");
        __AccessControl_init();
        __ERC20_init("RARI", "RARI");
        __ERC20Votes_init();

        if (adminAddress != address(0)) {
            _grantRole(DEFAULT_ADMIN_ROLE, adminAddress);
        } else {
            _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        }

        if (minterAddress != address(0)) {
            _grantRole(MINTER_ROLE, minterAddress);
        }

        _previous = previousToken;
        _l1 = l1;
        _customGateway = customGatewayAddress;
        _router = routerAddress;
    }

    function setCustomGateway(address customGatewayAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _customGateway = customGatewayAddress;
    }

    function setRouter(address routerAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _router = routerAddress;
    }

    function wrap(address account, uint256 amount) external {
        require(_previous.transferFrom(_msgSender(), address(this), amount));
        super._mint(account, amount);
    }

    function bridgeMint(address account, uint256 amount) external override onlyRole(MINTER_ROLE) {
        super._mint(account, amount);
    }

    function bridgeBurn(address account, uint256 amount) external override onlyRole(MINTER_ROLE) {
        super._burn(account, amount);
    }

    function l1Address() external view returns (address) {
        return _l1;
    }

    function previous() external view returns (address) {
        return address(_previous);
    }

    function customGateway() external view returns (address) {
        return _customGateway;
    }

    function router() external view returns (address) {
        return _router;
    }

    function isArbitrumEnabled() external pure returns (uint8) {
        return 0xb1;
    }

    function registerTokenOnL2(
        address l2CustomTokenAddress, 
        uint256 maxSubmissionCostForCustomGateway, 
        uint256 maxSubmissionCostForRouter, 
        uint256 maxGasForCustomGateway, 
        uint256 maxGasForRouter, 
        uint256 gasPriceBid, 
        uint256 valueForGateway, 
        uint256 valueForRouter, 
        address creditBackAddress
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) {

        IL1CustomGateway(_customGateway).registerTokenToL2{value: valueForGateway}(
            l2CustomTokenAddress, maxGasForCustomGateway, gasPriceBid, maxSubmissionCostForCustomGateway, creditBackAddress
        );

        IL2GatewayRouter(_router).setGateway{value: valueForRouter}(
            _customGateway, maxGasForRouter, gasPriceBid, maxSubmissionCostForRouter, creditBackAddress
        );
    }
}
