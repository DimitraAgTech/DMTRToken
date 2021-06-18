const { expect } = require("chai");
const { parseEther, formatEther, formatUnits, parseUnits, formatBytes32String } = require("ethers/lib/utils");
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

    // console.log(owner.address);

    

    // console.log((await dimitraToken.hasRole(formatBytes32String("MINTER_ROLE"),owner.address)));
    dimitraToken.grantRole(formatBytes32String("MINTER_ROLE"),owner.address);
    // console.log((await dimitraToken.getRoleMember(formatBytes32String("MINTER_ROLE"),0)));
  })
})