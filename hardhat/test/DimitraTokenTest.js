const { expect } = require("chai");
const { parseEther, formatEther, formatUnits, parseUnits, formatBytes32String, keccak256, id } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

  let token;
  let dimitraToken;
  let owner;
  let account1;
  let account2;
  let accounts;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    token = await ethers.getContractFactory("DimitraToken");
    [owner, account1, account2, ...accounts] = await ethers.getSigners();
    dimitraToken = await token.deploy();
  });

describe("Token contract Deployment", function() {
  it("Deployment should have name 'Dimitra Token', symbol 'DMTR', decimals 18,.", async function() {
    expect(await dimitraToken.name()).to.equal('Dimitra Token');
    expect(await dimitraToken.symbol()).to.equal('DMTR');
    expect(await dimitraToken.decimals()).to.equal(18);
  });

  it("Deployment should assign the mintable tokens to the owner", async function() {
    const ownerBalance = await dimitraToken.balanceOf(owner.address);
    console.log(formatEther(ownerBalance));
    expect(await dimitraToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Deployment should assign cap of 1 billion",async function(){
    expect(formatEther(await dimitraToken.cap())).to.equal(formatUnits( parseUnits("1000000000", 18)));
  })
});

describe("Token Role Tests", function() {
  it("Check and return various roles", async function() {
    console.log("owner.address is ", owner.address);
    console.log("MINTER_ROLE should be owner ", (await dimitraToken.hasRole(id("MINTER_ROLE"), owner.address)));
    console.log("PAUSER_ROLE should be owner ", (await dimitraToken.hasRole(id("PAUSER_ROLE"), owner.address)));
    console.log("BURNER_ROLE should be owner ", (await dimitraToken.hasRole(id("BURNER_ROLE"), owner.address)));
    console.log("ADMIN_ROLE should be owner ", (await dimitraToken.hasRole(id("ADMIN_ROLE"), owner.address)));
    console.log("ADMIN_ROLE2 should be owner ", (await dimitraToken.hasRole(id("ADMIN_ROLE2"), owner.address)));
  })

  it("Grant roles test", async function() {
    console.log("owner.address is ", owner.address);
    await dimitraToken.grantRole(id("MINTER_ROLE"), account1.address);
    await dimitraToken.connect(account1).mint(account1.address,parseUnits("1000",18));
    console.log(formatEther(await dimitraToken.balanceOf(account1.address)));
  })

  it("Granting role from owner account should succeed", async function() {
    console.log("owner.address is ", owner.address);
    await dimitraToken.connect(owner).grantRole(id("MINTER_ROLE"), account1.address);
  })

  it("Granting role from non owner account should be prevented", async function() {
    try {
      await dimitraToken.connect(account1).grantRole(id("MINTER_ROLE"), account2.address);
      throw new Error('Expected error');
    }
    catch (e) {
      if (e.message && e.message === 'Expected error') throw e
      console.log("Granting role from non owner account was prevented");
    }
  })

// hasRole(role, account)
// getRoleMemberCount(role)
// getRoleMember(role, index)
// getRoleAdmin(role)
// grantRole(role, account)
// revokeRole(role, account)
// renounceRole(role, account)

})
