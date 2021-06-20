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
  contractFactory = await ethers.getContractFactory("DimitraToken");
  [owner, account1, account2, ...accounts] = await ethers.getSigners();
  dimitraToken = await contractFactory.deploy();
});

describe("Token Deployment Tests", function() {

  it("Deployment should have name 'Dimitra Token', symbol 'DMTR', decimals 18", async function() {
    expect(await dimitraToken.name()).to.equal('Dimitra Token');
    expect(await dimitraToken.symbol()).to.equal('DMTR');
    expect(await dimitraToken.decimals()).to.equal(18);
  });

  it("Deployment should assign supply of zero", async function() {
    expect(await dimitraToken.totalSupply()).to.equal(0);
  });

  it("Deployment should assign cap of 1 billion", async function(){
    expect(formatEther(await dimitraToken.cap())).to.equal(formatUnits( parseUnits("1000000000", 18)));
  })

  it("Deployment should assign owner balance of zero", async function() {
    expect(await dimitraToken.balanceOf(owner.address)).to.equal(0);
  });
});

describe("Token Role Tests", function() {
  it("Check and return various roles", async function() {
    console.log("owner.address is ", owner.address);
    console.log("owner should be MINTER_ROLE ", (await dimitraToken.hasRole(id("MINTER_ROLE"), owner.address)));
    console.log("owner should be PAUSER_ROLE ", (await dimitraToken.hasRole(id("PAUSER_ROLE"), owner.address)));
    console.log("owner should be BURNER_ROLE ", (await dimitraToken.hasRole(id("BURNER_ROLE"), owner.address)));
    console.log("owner should be ADMIN_ROLE  ", (await dimitraToken.hasRole(id("ADMIN_ROLE"), owner.address)));
    console.log("owner should be ADMIN_ROLE2 ", (await dimitraToken.hasRole(id("ADMIN_ROLE2"), owner.address)));
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
  });
});

describe("Token Minting Tests", function() {

  it("Non-owner cannot mint tokens", async function() {
    try {
      await dimitraToken.connect(account1).mint(account1.address, 10);
      throw new Error('Expected error');
    }
    catch (e) {
      if (e.message && e.message === 'Expected error') throw e
      console.log("Minting tokens from non owner account was prevented");
    }
  });
  
  it("Minted tokens can be assigned by owner to owner address", async function() {
    const mintAmount = '1000000000000000000';
    const balanceBeforeMinting = await dimitraToken.balanceOf(owner.address);
    console.log("balanceBeforeMinting", formatEther(balanceBeforeMinting));
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    const balanceAfterMinting = await dimitraToken.balanceOf(owner.address);
    console.log("balanceAfterMinting", formatEther(balanceAfterMinting));
    expect(balanceAfterMinting).to.equal(balanceBeforeMinting + mintAmount);
  });

  it("Minted tokens can be assigned by owner to another address", async function() {
    const mintAmount = '1000000000000000000';
    const balanceBeforeMinting = await dimitraToken.balanceOf(account1.address);
    console.log("balanceBeforeMinting", formatEther(balanceBeforeMinting));
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    const balanceAfterMinting = await dimitraToken.balanceOf(account1.address);
    console.log("balanceAfterMinting", formatEther(balanceAfterMinting));
    expect(balanceAfterMinting).to.equal(balanceBeforeMinting + mintAmount);
  });
});
