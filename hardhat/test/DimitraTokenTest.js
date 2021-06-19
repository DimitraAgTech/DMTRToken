const { expect } = require("chai");
const { parseEther, formatEther, formatUnits, parseUnits, formatBytes32String, keccak256, id } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

describe("Token contract Deployment", function() {
  it("Deployment should assign the mintable tokens to the owner", async function() {
    const [owner] = await ethers.getSigners();

    const DMTR = await ethers.getContractFactory("DimitraToken");

    const dimitraToken = await DMTR.deploy();

    const ownerBalance = await dimitraToken.balanceOf(owner.address);

    console.log(formatEther(ownerBalance));
    expect(await dimitraToken.totalSupply()).to.equal(ownerBalance);
  });

  it("Deployment should assign cap of 1 billion",async function(){
    const DMTR = await ethers.getContractFactory("DimitraToken");

    const dimitraToken = await DMTR.deploy();

    expect(formatEther(await dimitraToken.cap())).to.equal(formatUnits( parseUnits("1000000000",18)));
  })
});


describe("Token Role Tests", function() {
  it("Check and return various roles", async function() {
    const [owner] = await ethers.getSigners();

    const DMTR = await ethers.getContractFactory("DimitraToken");

    const dimitraToken = await DMTR.deploy();

    console.log("owner.address is ",owner.address);

    // adminBytes = ethers.utils.formatBytes32String("0x00");
    // console.log("adminBytes are ",adminBytes);

    // console.log("DEFAULT_ADMIN_ROLE should be owner ",(await dimitraToken.hasRole(adminBytes,owner.address)))


    console.log("MINTER_ROLE should be owner ",(await dimitraToken.hasRole(id("MINTER_ROLE"),owner.address)));
    console.log("PAUSER_ROLE should be owner ",(await dimitraToken.hasRole(id("PAUSER_ROLE"),owner.address)));
    console.log("BURNER_ROLE should be owner ",(await dimitraToken.hasRole(id("BURNER_ROLE"),owner.address)));
    console.log("ADMIN_ROLE should be owner ",(await dimitraToken.hasRole(id("ADMIN_ROLE"),owner.address)));
    console.log("ADMIN_ROLE2 should be owner ",(await dimitraToken.hasRole(id("ADMIN_ROLE2"),owner.address)));

  })

  it("Grant roles test", async function() {
    const [owner,account1, account2, account3] = await ethers.getSigners();

    const DMTR = await ethers.getContractFactory("DimitraToken");

    const dimitraToken = await DMTR.deploy();

    console.log("owner.address is ",owner.address);

    // Trying to mint from another owner
    // expect((await dimitraToken.connect(account1).mint(account1.address,parseUnits("1000",18))).to.equal("DMTRToken: must have minter role to mint"));

    await dimitraToken.grantRole(id("MINTER_ROLE"),account1.address);
    await dimitraToken.connect(account1).mint(account1.address,parseUnits("1000",18));
    console.log(formatEther(await dimitraToken.balanceOf(account1.address)));
  })

  it("Granting role from non admin account", async function() {
    const [owner,account1, account2, account3] = await ethers.getSigners();

    const DMTR = await ethers.getContractFactory("DimitraToken");

    const dimitraToken = await DMTR.deploy();

    console.log("owner.address is ",owner.address);

    await dimitraToken.connect(account1).grantRole(id("MINTER_ROLE"),account1.address);

  })
})