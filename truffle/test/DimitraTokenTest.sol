// SPDX-License-Identifier: UNLICENSED 

pragma solidity ^0.8.0;


import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DimitraToken.sol";

contract DimitraTokenTest{

    function testTotalSupplyCap() public {
        DimitraToken DMT = DimitraToken(DeployedAddresses.DimitraToken());
        Assert.equal(DMT.cap(),10**9 * 10**18,"DMTRTokenTest: Cap placed is not correct"); 
    }

    function testTotalSupplyCapIncorrect() public {
        DimitraToken DMT = DimitraToken(DeployedAddresses.DimitraToken());
        Assert.notEqual(DMT.cap(),1000000,"DMTRTokenTest: Cap placed is not correct"); 
    }

    function testMintInitialAmount() public{
        DimitraToken DMT = DimitraToken(DeployedAddresses.DimitraToken());
        uint256 totalSupply = DMT.totalSupply();
        
        Assert.equal(totalSupply, 10**6 * 10**18, "DMTRTokenTest: Initial Amount set is not million");
    }
}