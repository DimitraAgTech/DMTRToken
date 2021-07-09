// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract DimitraToken is ERC20PresetMinterPauser {
    uint private immutable _cap;
    bytes32 private constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
  
    // Change visibility to private
    mapping (address => mapping(uint => uint)) private lockBoxMap; // Mapping of user => vestingDay => amount
    mapping (address => uint[]) private userReleaseTimes; // user => vestingDays
    uint[] private updatedReleaseTimes;
    uint private totalLockBoxBalance;

    event LogIssueLockedTokens(address sender, address recipient, uint amount, uint releaseTime);

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint(decimals())); // Cap limit set to 1 billion tokens

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(ISSUER_ROLE,_msgSender());
    }

    function cap() public view returns (uint) {
        return _cap;
    }

    function mint(address account, uint256 amount) public virtual override {
        require(ERC20.totalSupply() + amount <= cap(), "DimitraToken: cap exceeded");
        ERC20PresetMinterPauser.mint(account, amount);
    }

    function issueLockedTokens(address recipient, uint lockAmount, uint releaseTime) public { // Vesting releaseTime is calculating in FrontEnd
        address sender = _msgSender();

        require(hasRole(ISSUER_ROLE, sender), "DimitraToken: must have issuer role to issue locked tokens");
        require(releaseTime >= block.timestamp, "DimitraToken: Release time must be greater than current block time");

        lockBoxMap[recipient][releaseTime] += lockAmount;
        totalLockBoxBalance += lockAmount;
        userReleaseTimes[recipient].push(releaseTime);

        _transfer(sender, recipient, lockAmount);

        emit LogIssueLockedTokens(msg.sender, recipient, lockAmount, releaseTime);
    }

    function transfer(address recipient, uint amount) public override returns (bool) {
        address sender = _msgSender();

        uint[] memory releaseTimes = userReleaseTimes[sender];
        uint arrLength = releaseTimes.length;
        uint lockedAmount;
        
        delete updatedReleaseTimes;
        
        for (uint i = 0; i < arrLength; i++){  // Releasing all tokens
            if(block.timestamp <= releaseTimes[i]){
                lockedAmount += lockBoxMap[sender][releaseTimes[i]];
            } else {
                totalLockBoxBalance -= lockBoxMap[sender][userReleaseTimes[sender][i]];
                delete lockBoxMap[sender][userReleaseTimes[sender][i]];
                delete userReleaseTimes[sender][i];
            }
        }
        for (uint i = 0; i < arrLength; i++){
            if (userReleaseTimes[sender][i] != 0){
                updatedReleaseTimes.push(userReleaseTimes[sender][i]);
            }
        }
        userReleaseTimes[sender] = updatedReleaseTimes;

        require(balanceOf(sender) - lockedAmount >= amount, "DimitraToken: Insufficient balance");
        _transfer(sender, recipient, amount);
        return true;
    }

    function getLockedBalance(address sender) public view returns (uint){
        uint userLockBoxBalance = 0;
        uint[] memory releaseTimes = userReleaseTimes[sender];
        uint arrLength = releaseTimes.length;

         if(arrLength != 0){
            for (uint i = 0; i < arrLength; i++){
                if(block.timestamp <= releaseTimes[i]){ // There can be a possibility where user has not released it using transfer function
                    userLockBoxBalance += lockBoxMap[sender][releaseTimes[i]];
                }
            }
         }
         
         return userLockBoxBalance;
    }

    function getTotalLockBoxBalance() public view returns (uint) {
        return totalLockBoxBalance;
    }
}
