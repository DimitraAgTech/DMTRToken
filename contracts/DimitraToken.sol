pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DimitraToken
 */
contract DimitraToken is ERC20 {

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor () public ERC20("Dimitra Token", "DMTR") {
        _mint(msg.sender, 1000 * (10 ** 6));
    }
}