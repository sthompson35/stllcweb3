// SPDX-License-Identifier: MIT
pragma solidity <0.9.0;

import { ERC1155Holder } from "./ERC1155Holder.sol";
import { ReentrancyGuard } from "./ReentrancyGuard.sol";

abstract contract BaseExchange is ERC1155Holder, ReentrancyGuard { }