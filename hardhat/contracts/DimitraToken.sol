// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract DimitraToken is ERC20PresetMinterPauser {
    uint private immutable _cap;
    bytes32 private constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
  
    mapping (address => mapping(uint => uint)) private lockBoxMap; // Mapping of user => releaseTime => amount
    mapping (address => uint[]) private userReleaseTimes; // user => releaseTime array
    uint [] private updatedReleaseTimes;
    uint private totalLockBoxBalance;

    event LogIssueLockedTokens(address sender, address recipient, uint amount, uint releaseTime);

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint(decimals())); // Cap limit set to 1 billion tokens
        _setupRole(ISSUER_ROLE,_msgSender());
    }

    function cap() public view returns (uint) {
        return _cap;
    }

    function mint(address account, uint256 amount) public virtual override {
        require(ERC20.totalSupply() + amount <= cap(), "DimitraToken: Cap exceeded");
        ERC20PresetMinterPauser.mint(account, amount);
    }

    function issueLockedTokens(address recipient, uint lockAmount, uint releaseTime) public { // NOTE: releaseTime is date calculated in front end (at 12:00:00 AM)
        address sender = _msgSender();

        require(hasRole(ISSUER_ROLE, sender), "DimitraToken: Must have issuer role to issue locked tokens");
        require(releaseTime > block.timestamp, "DimitraToken: Release time must be greater than current block time");

        lockBoxMap[recipient][releaseTime] += lockAmount;
        userReleaseTimes[recipient].push(releaseTime);
        totalLockBoxBalance += lockAmount;

        _transfer(sender, recipient, lockAmount);

        emit LogIssueLockedTokens(msg.sender, recipient, lockAmount, releaseTime);
    }

    function transfer(address recipient, uint amount) public override returns (bool) {
        address sender = _msgSender();

        uint[] memory releaseTimes = userReleaseTimes[sender];
        uint lockedAmount;
        
        delete updatedReleaseTimes;
        
        for (uint i = 0; i < releaseTimes.length; i++) {  // Release all expired locks
            if(block.timestamp <= releaseTimes[i]) {
                lockedAmount += lockBoxMap[sender][releaseTimes[i]];
            } else {
                totalLockBoxBalance -= lockBoxMap[sender][userReleaseTimes[sender][i]];
                delete lockBoxMap[sender][userReleaseTimes[sender][i]];
                delete userReleaseTimes[sender][i];
            }
        }
        for (uint i = 0; i < releaseTimes.length; i++) {
            if (userReleaseTimes[sender][i] != 0) {
                updatedReleaseTimes.push(userReleaseTimes[sender][i]);
            }
        }
        userReleaseTimes[sender] = updatedReleaseTimes;

        require(balanceOf(sender) - lockedAmount >= amount, "DimitraToken: Insufficient balance");
        _transfer(sender, recipient, amount);
        return true;
    }

    function getTotalLockBoxBalance() public view returns (uint) {
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to get total lockbox balance");
        return totalLockBoxBalance;
    }

    function getLockedBalance(address user) public view returns (uint) {
        address sender = _msgSender();
        require(user == sender || hasRole(ISSUER_ROLE, sender), "DimitraToken: Only issuer role or sender who owns address can get locked balance");

        uint userLockBoxBalance = 0;
        uint[] memory releaseTimes = userReleaseTimes[user];

        for (uint i = 0; i < releaseTimes.length; i++) {
            if (block.timestamp <= releaseTimes[i]) {
                userLockBoxBalance += lockBoxMap[user][releaseTimes[i]];
            }
        }
         
        return userLockBoxBalance;
    }

    function getReleasedBalance(address user) public view returns (uint) {
        address sender = _msgSender();
        require(user == sender || hasRole(ISSUER_ROLE, sender), "DimitraToken: Only issuer role or sender who owns address can get released balance");
        return balanceOf(user) - getLockedBalance(user);
    }
}
