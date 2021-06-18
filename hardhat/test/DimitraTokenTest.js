const { expect } = require("chai");
const { parseEther, formatEther, formatUnits, parseUnits } = require("ethers/lib/utils");

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