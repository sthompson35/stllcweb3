// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import { IERC20 } from "./IERC20.sol";

/// @title IConditionalTokens
/// @notice Minimal interface for the Gnosis Conditional Tokens Framework (CTF)
///         used by AssetOperations to split and merge positions.
interface IConditionalTokens {
    function splitPosition(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;

    function mergePositions(
        IERC20 collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;
}
