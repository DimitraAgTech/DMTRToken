// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract DimitraToken is ERC20PresetMinterPauser {
    uint256 private immutable _cap;

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint256(decimals())); // Cap limit set to 1 billion tokens
    }

    function cap() public view virtual returns (uint256) {
        return _cap;
    }
}
