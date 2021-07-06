// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "hardhat/console.sol";

contract DimitraToken is ERC20PresetMinterPauser {
    uint private immutable _cap;
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
  
    // Change visibility to private
    mapping (address => mapping(uint => uint)) public LockBoxMap; // Mapping of user => vestingDay => amount
    mapping (address => uint[]) public userReleaseTime; // user => vestingDays

    event LogIssueLockedTokens(address sender, address recipient, uint amount, uint releaseTimeStamp);

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint(decimals())); // Cap limit set to 1 billion tokens
        _setupRole(ISSUER_ROLE,_msgSender());
    }

    function cap() public view returns (uint) {
        return _cap;
    }

    function issueLockedTokens(address recipient, uint lockAmount, uint releaseTimeStamp) public { // Send the mature date by calculating if from the FrontEnd
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to issue locked tokens");
        require(releaseTimeStamp >= block.timestamp + 86400); // release time stamo must be at least 24 hours from now

        LockBoxMap[recipient][releaseTimeStamp] += lockAmount;

        userReleaseTime[recipient].push(releaseTimeStamp);

        // console.log("LockBoxMap is ",LockBoxMap);
        // console.log("isLocked is ",isLocked);
        // console.log("userReleaseTime is ",userReleaseTime);

        emit LogIssueLockedTokens(msg.sender, recipient, lockAmount, releaseTimeStamp);
        _transfer(_msgSender(), recipient, lockAmount);
    }

    function transfer(address recipient,uint amount) public override returns (bool) {
        address sender = _msgSender();
        uint[] memory releaseTimes = userReleaseTime[sender];
        uint arrLength = releaseTimes.length();
        uint memory lockedAmount;
        uint[] memory updatedReleaseTimes;

        if(arrLength != 0){
            for (uint i = 0; i < arrLength; i++){  // Releasing all tokens
                if(block.timestamp <= releaseTimes[i]){
                    lockedAmount += LockBoxMap[sender][releaseTimes[i]];
                } else {
                    delete LockBoxMap[sender][userReleaseTime[sender][i]];
                    delete userReleaseTime[sender][i];
                }
            }

            for (uint i = 0; i < arrLength; i++){
                if (userReleaseTime[sender][i] != 0){
                    updatedReleaseTimes.push(userReleaseTime[sender][i]);
                }
            }

            userReleaseTime[sender] = updatedReleaseTimes;
        }

        require(balanceOf(sender) - lockedAmount >= amount, "DimitraToken: Insufficient balance");
    }


    // function transfer(address recipient, uint256 amount) public override returns (bool) { // only works if sender has sufficient released tokens
    //     for (uint i = 0; i < lockBoxes.length; i++) { // release all expired locks
    //         if (block.timestamp >= lockBoxes[i].releaseTimeStamp) {
    //             if (lockBoxes.length > 0) {
    //                 lockBoxes[i] = lockBoxes[lockBoxes.length-1];
    //                 lockBoxes.pop();
    //             }
    //         }
    //     }
    //     address sender = _msgSender();
    //     uint availableBalanceOfSender = balanceOf(sender); // optimistic so we have to subtract all locked tokens
    //     for (uint i = 0; i < lockBoxes.length; i++) { // see if it is possible
    //         if (sender == lockBoxes[i].beneficiary) {
    //             availableBalanceOfSender -= lockBoxes[i].lockAmount;
    //             require(availableBalanceOfSender >= amount, "DimitraToken: transfer amount exceeds balance"); // did not work out
    //         }
    //     }
    //     _transfer(sender, recipient, amount); // did work out
    //     return true;
    // }

    // function getLockBoxCount() public view returns (uint) {
    //     return LockBoxMap.length;
    // }

    // function getTotalLockBoxBalance() public view returns (uint) {
    //     uint totalLockBoxBalance = 0;
    //     for (uint i = 0; i < lockBoxes.length; i++) {
    //         totalLockBoxBalance += lockBoxes[i].lockAmount;
    //     }
    //     return totalLockBoxBalance;
    // }
}
