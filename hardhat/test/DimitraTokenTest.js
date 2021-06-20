const { expect } = require("chai");
const { parseEther, formatEther, formatUnits, parseUnits, formatBytes32String, keccak256, id } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

let token;
let dimitraToken;
let owner;
let account1;
let account2;
let accounts; // arry of remaining 7 accounts

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

  it("Deployment should assign initial supply of zero", async function() {
    expect(await dimitraToken.totalSupply()).to.equal(0);
  });

  it("Deployment should assign cap of 1 billion tokens", async function(){
    expect(formatEther(await dimitraToken.cap())).to.equal(formatUnits(parseUnits("1000000000", 18)));
  })

  it("Deployment should assign owner balance of zero", async function() {
    expect(await dimitraToken.balanceOf(owner.address)).to.equal(0);
  });
});

describe("Token Role Tests", function() {

  it("Check that owner has minter, pauser, burner, and admin roles", async function() {
    //console.log("owner.address is ", owner.address);
    expect(await dimitraToken.hasRole(id("MINTER_ROLE"), owner.address)).to.equal(true);
    expect(await dimitraToken.hasRole(id("PAUSER_ROLE"), owner.address)).to.equal(true);
    expect(await dimitraToken.hasRole(id("BURNER_ROLE"), owner.address)).to.equal(true);
    expect(await dimitraToken.hasRole(id("ADMIN_ROLE"),  owner.address)).to.equal(true);
    expect(await dimitraToken.hasRole(id("ADMIN_ROLE2"), owner.address)).to.equal(true);
  })

  it("Check that non owner does not have minter, pauser, burner, and admin roles", async function() {
    expect(await dimitraToken.hasRole(id("MINTER_ROLE"), account1.address)).to.equal(false);
    expect(await dimitraToken.hasRole(id("PAUSER_ROLE"), account1.address)).to.equal(false);
    expect(await dimitraToken.hasRole(id("BURNER_ROLE"), account1.address)).to.equal(false);
    expect(await dimitraToken.hasRole(id("ADMIN_ROLE"),  account1.address)).to.equal(false);
    expect(await dimitraToken.hasRole(id("ADMIN_ROLE2"), account1.address)).to.equal(false);
  })

  it("Contract owner can grant minter role to non owner account", async function() {
    //console.log("owner.address is ", owner.address);
    await dimitraToken.grantRole(id("MINTER_ROLE"), account1.address);                   // ******* is this OK ?????
    await dimitraToken.connect(account1).mint(account1.address,parseUnits("1000", 18));
    //console.log(formatEther(await dimitraToken.balanceOf(account1.address)));
  })

  it("Contract owner can grant role", async function() {
    //console.log("owner.address is ", owner.address);
    await dimitraToken.connect(owner).grantRole(id("MINTER_ROLE"), account1.address);
    await dimitraToken.connect(account1).mint(account1.address,parseUnits("1000", 18));
  })

  it("Non contract owner cannot grant role", async function() {
    try {
      await dimitraToken.connect(account1).grantRole(id("MINTER_ROLE"), account2.address);
      throw new Error('Error: Must be owner to grant role');
    }
    catch (e) {
      //console.log("***e.message***", e.message);
      if (e.message && e.message === 'Error: Must be owner to grant role') throw e
     }
  });
});

describe("Token Minting Tests", function() {

  it("Non-owner cannot mint tokens", async function() {
    try {
      await dimitraToken.connect(account1).mint(account1.address, 10);
      throw new Error('Error: Must have minter role to mint');
    }
    catch (e) {
      //console.log("***e.message***", e.message);
      if (e.message && e.message === 'Error: Must have minter role to mint') throw e
      
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

  it("Minting tokens increments total supply accordingly", async function() {
    const totalSupplyBeforeMinting = await dimitraToken.totalSupply();
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    const totalSupplyAfterMinting = await dimitraToken.totalSupply();
    expect(totalSupplyAfterMinting).to.equal(totalSupplyBeforeMinting + mintAmount);
  });
});

describe("Token Burning Tests", function() {

  it("Contract owner can burn tokens", async function() {
    const mintAmount = '1000000000000000000';
    dimitraToken.connect(owner).mint(owner.address, mintAmount);
    await dimitraToken.connect(owner).burn(mintAmount);
  });

  it("Non contract owner cannot burn tokens", async function() {
    const mintAmount = '1000000000000000000';
    dimitraToken.connect(owner).mint(account1.address, mintAmount);
    try {
      await dimitraToken.connect(account1).burn(mintAmount);   // expected error -> test succeeded
      throw new Error('Error: Must have burner role to burn'); // if we get here -> test failed
    }
    catch (e) {
      //console.log("***e.message***", e.message);
      if (e.message && e.message === 'Error: Must have burner role to burn') throw e
    }
  });
});

// describe("Token Pausing Tests", function() {
// });

/*
*** list of methods that may need unit testing ***
totalSupply()
cap()
balanceOf(address account)
transfer(address recipient, uint256 amount)
allowance(address owner, address spender)
approve(address spender, uint256 amount)
transferFrom(address sender, address recipient, uint256 amount)
increaseAllowance(address spender, uint256 addedValue)
decreaseAllowance(address spender, uint256 subtractedValue)
mint(account, amount)
isMinter(account)
addMinter(account)
renounceMinter()
totalSupply()
balanceOf(account)
transfer(recipient, amount)
allowance(owner, spender)
approve(spender, amount)
transferFrom(sender, recipient, amount)
increaseAllowance(spender, addedValue)
decreaseAllowance(spender, subtractedValue)
burn(amount)
burnFrom(account, amount)
paused()
pause()
unpause()
*/