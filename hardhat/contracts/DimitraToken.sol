// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.2/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol"; // remix

contract DimitraToken is ERC20PresetMinterPauser {
    uint private immutable _cap;
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
  
    struct LockBox {
        address beneficiary;
        uint balance;
        uint releaseTime;
    }
    LockBox[] public lockBoxes; // Not a mapping by address because we need to support multiple tranches per address

    event LogLockDeposit(address sender, address beneficiary, uint amount, uint releaseTime);
    event LogLockWithdrawal(address sender, address beneficiary, uint amount, uint releaseTime);

    constructor() ERC20PresetMinterPauser("Dimitra Token", "DMTR") {
        _cap = 1000000000 * (10 ** uint(decimals())); // Cap limit set to 1 billion tokens
        _setupRole(ISSUER_ROLE,_msgSender());
    }

    function cap() public view returns (uint) {
        return _cap;
    }

    // function lockDeposit(address beneficiary, uint amount, uint vestingDays) public { // daysfor production
    //     require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to issue locked tokens");
    //     LockBox memory lockBox = LockBox(beneficiary, amount, block.timestamp + vestingDays * 1 days);
    //     lockBoxes.push(lockBox);
    //     emit LogLockDeposit(msg.sender, lockBox.beneficiary, lockBox.balance, lockBox.releaseTime);
    // }

    function lockDeposit(address beneficiary, uint amount, uint vestingSeconds) public { // seconds for testing only
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to issue locked tokens");
        LockBox memory lockBox = LockBox(beneficiary, amount, block.timestamp + vestingSeconds * 1 seconds);
        lockBoxes.push(lockBox);
        emit LogLockDeposit(msg.sender, lockBox.beneficiary, lockBox.balance, lockBox.releaseTime);
    }

    function triggerWithdrawAll() public {
        require(hasRole(ISSUER_ROLE, _msgSender()), "DimitraToken: must have issuer role to trigger withdraw of all matured tokens");
        for (uint i = 0; i < lockBoxes.length; ++i) {
            LockBox memory lockBox = lockBoxes[i];
            if (lockBox.releaseTime < block.timestamp) {
                transfer(lockBox.beneficiary, lockBox.balance);
                emit LogLockWithdrawal(msg.sender, lockBox.beneficiary, lockBox.balance, lockBox.releaseTime);
                for (uint j = i; j<lockBoxes.length-1; j++){
                    lockBoxes[j] = lockBoxes[j+1];
                }
                lockBoxes.pop();
            }
        }
    }

    function getLockBoxCount() public view returns (uint) {
        return lockBoxes.length;
    }

    function getTotalLockBoxBalance() public view returns (uint) {
        uint totalLockBoxBalance = 0;
        for (uint i = 0; i < lockBoxes.length; ++i) {
            LockBox memory lockBox = lockBoxes[i];
            totalLockBoxBalance += lockBox.balance;
        }
        return totalLockBoxBalance;
    }
}
