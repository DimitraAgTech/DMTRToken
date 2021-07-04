// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract DimitraToken is ERC20PresetMinterPauser {
    using SafeMath for uint;
    uint private immutable _cap;
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
  
    struct LockBox {
        address beneficiary;
        uint balance;
        uint releaseTime; // in days
    }
    LockBox[] public lockBoxes; // Not a mapping by address because we need to support multiple tranches per address
    uint public LockBoxBalance;

    event LogLockDeposit(address sender, address beneficiary, uint amount, uint releaseTimeDays);    // days - for production only
    event LogLockRelease(address sender, address beneficiary, uint amount, uint releaseTimeDays); // days - for production only

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint(decimals())); // Cap limit set to 1 billion tokens
        _setupRole(ISSUER_ROLE,_msgSender());
    }

    function cap() public view returns (uint) {
        return _cap;
    }

    function lockDeposit(address beneficiary, uint amount, uint vestingDays) public {
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to issue locked tokens");
        require(amount > 0 && vestingDays > 0);
        LockBox memory lockBox = LockBox(beneficiary, amount, block.timestamp + vestingDays * 1 days);
        lockBoxes.push(lockBox);
        LockBoxBalance += amount;
        emit LogLockDeposit(msg.sender, lockBox.beneficiary, lockBox.balance, lockBox.releaseTime);
    }

    function triggerReleaseAllMatured() public {
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to trigger Release of all matured tokens");
        for (uint i = 0; i < lockBoxes.length; i++) {
            if (block.timestamp >= lockBoxes[i].releaseTime) {
                transfer(lockBoxes[i].beneficiary, lockBoxes[i].balance);
                emit LogLockRelease(msg.sender, lockBoxes[i].beneficiary, lockBoxes[i].balance, lockBoxes[i].releaseTime);
                lockBoxes[i].balance = 0;
                LockBoxBalance -= lockBoxes[i].balance;
            }
        }
        // for (uint i = 0; i < lockBoxes.length; i++) {
        //     if (lockBoxes[i].balance == 0) {
        //         for (uint j = i; j < lockBoxes.length-1; j++){
        //             lockBoxes[j] = lockBoxes[j+1];
        //         }
        //         lockBoxes.pop();
        //     }
        //     if (lockBoxes.length == 1 && lockBoxes[0].balance == 0) { // single last element is edge case
        //         lockBoxes.pop();
        //     }
        // }
    }

    function getLockBoxCount() public view returns (uint) {
        return lockBoxes.length;
    }

    function getTotalLockBoxBalance() public view returns (uint) {
        // uint totalLockBoxBalance = 0;
        // for (uint i = 0; i < lockBoxes.length; i++) {
        //     totalLockBoxBalance += lockBoxes[i].balance;
        // }


        return LockBoxBalance;
    }



    function getLockBoxMaturedCount() public view returns (uint) {
        uint lockBoxMaturedCount = 0;
        for (uint i = 0; i < lockBoxes.length; i++) {
            if (block.timestamp >= lockBoxes[i].releaseTime) {
                lockBoxMaturedCount += 1;
            }
        }
        return lockBoxMaturedCount;
    }

    function getTotalLockBoxMaturedBalance() public view returns (uint) {
        uint totalLockBoxMaturedBalance = 0;
        for (uint i = 0; i < lockBoxes.length; i++) {
            if (block.timestamp >= lockBoxes[i].releaseTime) {
                totalLockBoxMaturedBalance += lockBoxes[i].balance;
            }
        }
        return totalLockBoxMaturedBalance;
    }
}
