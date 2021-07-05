// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

import "hardhat/console.sol";

contract DimitraToken is ERC20PresetMinterPauser  {
    uint private immutable _cap;
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
  
    struct LockBox {
        address beneficiary;
        uint amount;
        uint releaseTimeStamp; // uint256 value in seconds since the epoch when lock is released
    }

    LockBox[] public lockBoxes; // Not a mapping by address because we need to support multiple tranches per address

    event LogIssueLockedTokens(address sender, address recipient, uint amount, uint releaseTimeStamp);

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint(decimals())); // Cap limit set to 1 billion tokens
        _setupRole(ISSUER_ROLE,_msgSender());
    }

    function cap() public view returns (uint) {
        return _cap;
    }

    function _mint(address account, uint256 amount) internal virtual override {
        require(totalSupply() + amount <= cap(), "DimitraToken: cap exceeded");
        super._mint(account, amount);
    }

    function issueLockedTokens(address recipient, uint amount, uint vestingDays) public {
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to issue locked tokens");
        uint releaseTimeStamp = block.timestamp + vestingDays * 1 days;
        LockBox memory lockBox = LockBox(recipient, amount, releaseTimeStamp);
        lockBoxes.push(lockBox);
        transfer(recipient, amount);
        emit LogIssueLockedTokens(msg.sender, recipient, amount, releaseTimeStamp);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) { // only works if sender has sufficient released tokens
        for (uint i = 0; i < lockBoxes.length; i++) { // release all expired locks
            if (block.timestamp >= lockBoxes[i].releaseTimeStamp) {
                lockBoxes[i] = lockBoxes[lockBoxes.length-1];
                lockBoxes.pop();
            }
        }
        address sender = _msgSender();
        uint availableBalanceOfSender = balanceOf(sender); // optimistic so we have to subtract locked tokens
        for (uint i = 0; i < lockBoxes.length; i++) {
            if (sender == lockBoxes[i].beneficiary) {
                availableBalanceOfSender -= lockBoxes[i].amount;
                require(availableBalanceOfSender >= amount, "DimitraToken: transfer amount exceeds balance"); // did not work out
            }
        }
        _transfer(sender, recipient, amount); // did work out
        return true;
    }

    function getLockBoxCount() public returns (uint) {
        for (uint i = 0; i < lockBoxes.length; i++) { // release all expired locks
            if (block.timestamp >= lockBoxes[i].releaseTimeStamp) {
                lockBoxes[i] = lockBoxes[lockBoxes.length-1];
                lockBoxes.pop();
            }
        }
        return lockBoxes.length;
    }

    function getTotalLockBoxBalance() public returns (uint) {
        uint totalLockBoxBalance = 0;
        for (uint i = 0; i < lockBoxes.length; i++) { // release all expired locks
            if (block.timestamp >= lockBoxes[i].releaseTimeStamp) {
                lockBoxes[i] = lockBoxes[lockBoxes.length-1];
                lockBoxes.pop();
            }
            else {
                totalLockBoxBalance += lockBoxes[i].amount;
            }
        }
        return totalLockBoxBalance;
    }
}
