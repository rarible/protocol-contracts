// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import {AccessControl} from "@openzeppelin/contracts-sol08/access/AccessControl.sol";
import {Create2} from "@openzeppelin/contracts-sol08/utils/Create2.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts-sol08/proxy/transparent/TransparentUpgradeableProxy.sol";

/**
 * @title PermissionedContractFactory
 * @dev Contract that create other contracts using the `CREATE2` opcode,
 * with calls limited to a preauthorized set of addresses.
 * The contract creator role is managed by the default admin role.
 *
 * --- Who will be intended to be authorized? ---
 * As an important note, initially,
 * only the 'Oasys core team' is granted the permission to deploy contracts.
 *
 * It will take time to grant privileges to the Oasys council,
 * so the Oasys team needs to lead them gradually,
 * enabling them to judge which contracts should be deployed.
 */
contract PermissionedContractFactory is AccessControl {
    // struct used for bulk contract creation
    struct DeployContract {
        uint256 amount; // Oasys don't funcd during deployment, so practicall this is 0
        bytes32 salt;
        bytes bytecode;
        address expected;
        string tag;
        bytes[] afterCalldatas;
    }

    /// @notice Semantic version.
    string private constant _VERSION = "0.0.2";

    /*************
     * Variables *
     *************/

    // keccak256 hash of "CONTRACT_CREATOR_ROLE" is the role identifier
    bytes32 public constant CONTRACT_CREATOR_ROLE = keccak256("CONTRACT_CREATOR_ROLE");

    /**********
     * Events *
     **********/

    /**
     * @dev Emitted when a contract is created.
     */
    event ContractCreated(address creator, uint256 amount, bytes32 salt, bytes bytecode, address newContract);

    constructor(
        address[] memory admins,
        address[] memory creators
    ) {
        // set the default admin role as the admin role for the contract
        _setRoleAdmin(DEFAULT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);

        // the contract creator role is managed by the default admin role
        _setRoleAdmin(CONTRACT_CREATOR_ROLE, DEFAULT_ADMIN_ROLE);

        // NOTE: overflow if admins.length >= 255(=max uint8 + 1)
        // indirectly asserting the length of admins is less than 255
        for (uint8 i = 0; i < admins.length; i++) {
            require(admins[i] != address(0), "PCC: admin is zero");
            _setupRole(DEFAULT_ADMIN_ROLE, admins[i]);
        }

        for (uint8 i = 0; i < creators.length; i++) {
            require(creators[i] != address(0), "PCC: creator is zero");
            _setupRole(CONTRACT_CREATOR_ROLE, creators[i]);
        }
    }

    /**
     * @dev returns the semantic version.
     */
    function version() external pure returns (string memory) {
        return _VERSION;
    }

    // slither-disable-start locked-ether

    /**
     * @dev creates a new contract using the `CREATE2` opcode.
     * Only callers granted with the `CONTRACT_CREATOR_ROLE` are permitted to call it.
     * The caller must send the expected new contract address for deployment.
     * If the expected address does not match the newly created one, the execution will be reverted.
     *
     * @param salt Optional, if not supplied, compute from bytecode
     * @param tag Registerd as metadata, we intended to set it as a contract name. this can be empty string
     * @param afterCalldatas Calldata to be called after contract creation
     *
     */
    function create(
        uint256 amount, // Oasys don't funcd during deployment, so practicall this is 0
        bytes32 salt,
        bytes calldata bytecode,
        address expected,
        string calldata tag,
        bytes[] calldata afterCalldatas
    ) external payable returns (address addr) {
        require(msg.value == amount, "PCC: incorrect amount sent");
        addr = _create2(amount, _salt(bytecode, salt), bytecode, expected, tag);
        // call the deployed contract with the provided calldata
        // intended to initialize the contract or transfer ownership
        _call(addr, afterCalldatas);
    }

    // slither-disable-start reentrancy-no-eth

    /**
     * @dev creates multiple contracts using the `CREATE2` opcode
     */
    function bulkCreate(DeployContract[] calldata deployContracts) external payable onlyRole(CONTRACT_CREATOR_ROLE) {
        uint256 remaining = msg.value;
        for (uint256 i = 0; i < deployContracts.length; i++) {
            require(deployContracts[i].amount <= remaining, "PCC: insufficient amount sent");

            // sub required amout
            remaining -= deployContracts[i].amount;

            address addr = _create2(
                deployContracts[i].amount,
                _salt(deployContracts[i].bytecode, deployContracts[i].salt),
                deployContracts[i].bytecode,
                deployContracts[i].expected,
                deployContracts[i].tag
            );
            _call(addr, deployContracts[i].afterCalldatas);
        }
        // assert that the sum of sent amount is equal to the total amount of bulk creation
        require(remaining == 0, "PCC: too much amount sent");
    }

    // slither-disable-end reentrancy-no-eth
    // slither-disable-end locked-ether

    /**
     * @dev computes the address of a contract that would be created using the `CREATE2` opcode.
     *
     * @param salt Optional, if not supplied, compute from bytecode
     */
    function getDeploymentAddress(bytes calldata bytecode, bytes32 salt) external view returns (address addr) {
        addr = Create2.computeAddress(_salt(bytecode, salt), keccak256(bytecode), address(this));
    }

    function _salt(bytes calldata bytecode, bytes32 salt) internal pure returns (bytes32) {
        return salt != bytes32(0) ? salt : _generateSalt(bytecode);
    }

    function _generateSalt(bytes memory bytecode) internal pure returns (bytes32 salt) {
        // use the first 32 bytes of bytecode as the salt
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let pointer := add(bytecode, 0x20)
            salt := mload(pointer)
        }
    }

    function _create2(
        uint256 amount,
        bytes32 salt,
        bytes calldata bytecode,
        address expected,
        string calldata tag
    ) internal returns (address addr) {
        // NOTE: Enables pre-funding of the address.
        // require(expected.balance == 0, "PCC: expected is not empty");

        // create the contract using the provided bytecode and salt
        // NOTE: in case of duplicate creation, the transaction will be reverted
        addr = Create2.deploy(amount, salt, bytecode);

        // revert if the deployed contract address does not match the expected address
        require(addr == expected, "PCC: unexpected address");

        emit ContractCreated(msg.sender, amount, salt, bytecode, addr);

        // register the metadata of the created contract
        //_registerMetadata(addr, msg.sender, tag);
    }

    function _call(address addr, bytes[] calldata datas) internal {
        for (uint256 i = 0; i < datas.length; i++) {
            // solhint-disable-next-line avoid-low-level-calls
            (bool success, bytes memory returndata) = addr.call(datas[i]);

            if (!success) {
                if (returndata.length > 0) {
                    // solhint-disable-next-line no-inline-assembly
                    assembly {
                        let returndata_size := mload(returndata)
                        revert(add(32, returndata), returndata_size)
                    }
                } else {
                    revert("PCC: after call failed");
                }
            }
        }
    }
}
