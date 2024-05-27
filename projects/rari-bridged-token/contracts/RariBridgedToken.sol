pragma solidity ^0.8.26;

import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import {ERC20VotesUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {IArbToken} from "@arbitrum/token-bridge-contracts/contracts/tokenbridge/arbitrum/IArbToken.sol";

/**
 * @title Interface needed to call function registerTokenToL2 of the L1CustomGateway
 */
interface IL1CustomGateway {
    function registerTokenToL2(
        address _l2Address,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256);
}

/**
 * @title Interface needed to call function setGateway of the L2GatewayRouter
 */
interface IL2GatewayRouter {
    function setGateway(
        address _gateway,
        uint256 _maxGas,
        uint256 _gasPriceBid,
        uint256 _maxSubmissionCost,
        address _creditBackAddress
    ) external payable returns (uint256);
}

contract RariBridgedToken is IArbToken, AccessControlUpgradeable, ERC20VotesUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    address public _l1Address;
    address public _customGatewayAddress;
    address public _routerAddress;

    function __RariBridgedToken_init(address __admin, address __minter, address __l1Address, address __customGatewayAddress, address __routerAddress) external initializer {
        __Context_init();
        __EIP712_init("RARI", "1");
        __AccessControl_init();
        __ERC20_init("RARI", "RARI");
        __ERC20Votes_init();

        _l1Address = __l1Address;
        _customGatewayAddress == __customGatewayAddress;
        __routerAddress == __routerAddress;

        if (__admin != address(0)) {
            _grantRole(DEFAULT_ADMIN_ROLE, __admin);
        } else {
            _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        }

        if (__minter != address(0)) {
            _grantRole(MINTER_ROLE, __minter);
        }
    }

    function bridgeMint(address account, uint256 amount) external override onlyRole(MINTER_ROLE) {
        super._mint(account, amount);
    }

    function bridgeBurn(address account, uint256 amount) external override onlyRole(MINTER_ROLE) {
        super._burn(account, amount);
    }

    function l1Address() external view returns (address) {
        return _l1Address;
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
    ) external payable {

        IL1CustomGateway(_customGatewayAddress).registerTokenToL2{ value: valueForGateway }(
            l2CustomTokenAddress,
            maxGasForCustomGateway,
            gasPriceBid,
            maxSubmissionCostForCustomGateway,
            creditBackAddress
        );

        IL2GatewayRouter(_routerAddress).setGateway{ value: valueForRouter }(
            _customGatewayAddress,
            maxGasForRouter,
            gasPriceBid,
            maxSubmissionCostForRouter,
            creditBackAddress
        );
    }
}
