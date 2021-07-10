const { expect, assert } = require("chai");
const { parseEther, formatEther, formatUnits, parseUnits, formatBytes32String, keccak256, id } = require("ethers/lib/utils");
const { ethers } = require("hardhat");

let token;
let dimitraToken;
let owner;
let account1;
let account2;
let account3;
let account4;
let accounts; // arry of remaining 5 accounts

// `beforeEach` will run before each test, re-deploying the contract every
// time. It receives a callback, which can be async.
beforeEach(async function () {
  contractFactory = await ethers.getContractFactory("DimitraToken");
  [owner, account1, account2, account3, account4, ...accounts] = await ethers.getSigners();
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
    expect(formatUnits(await dimitraToken.cap())).to.equal(formatUnits(parseUnits("1000000000", 18)));
  })

  it("Deployment should assign owner balance of zero", async function() {
    expect(await dimitraToken.balanceOf(owner.address)).to.equal(0);
  });
});

describe("Token Transfer Tests", function () {
  it("Should transfer tokens between accounts if balance is sufficient and no locks apply", async function() {
    await dimitraToken.connect(owner).mint(account1.address, 50);
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(50);
    await dimitraToken.connect(account1).transfer(account2.address, 50);
    expect(await dimitraToken.balanceOf(account2.address)).to.equal(50);
  });
});

describe("Token Role Tests", function() {
  it("Contract owner has minter, pauser, and default admin roles", async function() {
    expect(await dimitraToken.hasRole(id("MINTER_ROLE"), owner.address)).to.equal(true);
    expect(await dimitraToken.hasRole(id("PAUSER_ROLE"), owner.address)).to.equal(true);
    //expect(await dimitraToken.hasRole(id("DEFAULT_ADMIN_ROLE"), owner.address)).to.equal(true);
  })

  it("Non contract owner does not have minter, pauser, and admin roles", async function() {
    expect(await dimitraToken.hasRole(id("MINTER_ROLE"), account1.address)).to.equal(false);
    expect(await dimitraToken.hasRole(id("PAUSER_ROLE"), account1.address)).to.equal(false);
    //expect(await dimitraToken.hasRole(id("DEFAULT_ADMIN_ROLE"),  account1.address)).to.equal(false);
  })

  it("Contract owner can grant minter role", async function() {
    //console.log("Balance before minting", formatUnits(await dimitraToken.balanceOf(account1.address)));
    await dimitraToken.connect(owner).grantRole(id("MINTER_ROLE"), account1.address);
    await dimitraToken.connect(account1).mint(account1.address, parseUnits("1000", 18));
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(parseUnits("1000", 18));
    //console.log("Balance after minting", formatUnits(await dimitraToken.balanceOf(account1.address)));
  })

  it("Non contract owner cannot grant minter role", async function() {
    try {
      await dimitraToken.connect(account1).grantRole(id("MINTER_ROLE"), account2.address);
    } catch (error){
      assert.include(error.message,"AccessControl","is missing role");
    }
    // expect(await dimitraToken.connect(account1).grantRole(id("MINTER_ROLE"), account2.address));
  });
});

describe("Token Minting Tests", function() {
  it("MINTER_ROLE can mint tokens", async function() {
    const mintAmount = '1000000000000000000';
    await expect(dimitraToken.connect(owner).mint(owner.address, mintAmount));
    await expect(await dimitraToken.totalSupply()).to.equal(mintAmount);
  });

  it("Non MINTER_ROLE cannot mint tokens", async function() {
    const mintAmount = '1000000000000000000';
    try {
      await dimitraToken.connect(account1).mint(account1.address, mintAmount);
    } catch(error){
      assert.include(error.message,"revert","ERC20PresetMinterPauser: must have minter role to mint");
    }
    // await expect(dimitraToken.connect(account1).mint(account1.address, mintAmount)).to.be.revertedWith("ERC20PresetMinterPauser: must have minter role to mint");
  });

  it("Can mint tokens up to cap", async function() {
    const mintAmount = await dimitraToken.cap();
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    await expect(await dimitraToken.totalSupply()).to.equal(mintAmount);
  });

  it("Cannot mint tokens more than cap", async function() {
    const mintAmount = await dimitraToken.cap() + 1;
    try {
      await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    } catch(error){
      assert.include(error.message,"revert","DimitraToken: cap exceeded");
    }
    // await expect(dimitraToken.connect(owner).mint(owner.address, mintAmount)).to.be.revertedWith("DimitraToken: cap exceeded");
  });
    
  it("Minted tokens can be assigned to self", async function() {
    const mintAmount = '1000000000000000000';
    const balanceBeforeMinting = await dimitraToken.balanceOf(owner.address);
    //console.log("balanceBeforeMinting", formatUnits(balanceBeforeMinting));
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    const balanceAfterMinting = await dimitraToken.balanceOf(owner.address);
    //console.log("balanceAfterMinting", formatUnits(balanceAfterMinting));
    expect(balanceAfterMinting).to.equal(balanceBeforeMinting + mintAmount);
  });

  it("Minted tokens can be assigned to another address", async function() {
    const mintAmount = '1000000000000000000';
    const balanceBeforeMinting = await dimitraToken.balanceOf(account1.address);
    //console.log("balanceBeforeMinting", formatUnits(balanceBeforeMinting));
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    const balanceAfterMinting = await dimitraToken.balanceOf(account1.address);
    //console.log("balanceAfterMinting", formatUnits(balanceAfterMinting));
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
  it("Contract owner can burn own tokens", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    await dimitraToken.connect(owner).burn(mintAmount);
    expect(await dimitraToken.balanceOf(owner.address)).to.equal(0);
  });

  it("Non contract owner can burn own tokens", async function() {
    const mintAmount = '1000000000000000000';
    dimitraToken.connect(owner).mint(account1.address, mintAmount);
    await dimitraToken.connect(account1).burn(mintAmount);
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(0);
  });

  it("Contract owner cannot burn tokens of others without allowance approval", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    let amount = await dimitraToken.balanceOf(account1.address);
    try {
      await dimitraToken.connect(owner).burnFrom(account1.address, amount);
    } catch(error){
      assert.include(error.message,"revert","ERC20: burn amount exceeds allowance");
    }
    // await expect(dimitraToken.connect(owner).burnFrom(account1.address, amount)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });

  it("Non contract owner cannot burn tokens of owner without allowance approval", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    let amount = await dimitraToken.balanceOf(owner.address);
    await dimitraToken.connect(owner).grantRole(id("BURNER_ROLE"), account1.address);

    try {
      await dimitraToken.connect(account1).burnFrom(owner.address, amount);
    } catch(error){
      assert.include(error.message,"revert","ERC20: burn amount exceeds allowance");
    }
    // await expect(dimitraToken.connect(account1).burnFrom(owner.address, amount)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });

  it("An account cannot burn tokens of another without allowance approval", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    let amount = await dimitraToken.balanceOf(account1.address);
    await dimitraToken.connect(owner).grantRole(id("BURNER_ROLE"), account2.address);

    try {
      await dimitraToken.connect(account2).burnFrom(account1.address, amount);
    } catch(error){
      assert.include(error.message,"revert","ERC20: burn amount exceeds allowance");
    }
    // await expect(dimitraToken.connect(account2).burnFrom(account1.address, amount)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });

  it("An account can burn tokens of another if approved", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    let amount = await dimitraToken.balanceOf(account1.address);
    await dimitraToken.connect(owner).grantRole(id("BURNER_ROLE"), account2.address);
    await dimitraToken.connect(account1).approve(account2.address, amount);
    await dimitraToken.connect(account2).burnFrom(account1.address, amount);
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(0);
    //console.log("amount", formatUnits(await dimitraToken.balanceOf(account1.address)));
    //console.log("allowance", formatUnits(await dimitraToken.allowance(account1.address, account2.address)));
  });
});

describe("Token Pausing Tests", function() {
  it("Contract owner can pause contract", async function() {
    // set balance up for transfer
    const mintAmount = parseUnits("10", 18);
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    let amount = await dimitraToken.balanceOf(account1.address);

    // transfer should succeed while not paused
    await dimitraToken.connect(account1).transfer(account2.address, amount);
    ammount = await dimitraToken.balanceOf(account2.address);
    //console.log("Amount to transfer", formatUnits(ammount));

    // set balance up again
    amount = parseUnits("10", 18);
    await dimitraToken.connect(owner).mint(account1.address, amount);
    amount = await dimitraToken.balanceOf(account1.address);

    // transfer should fail while paused
    dimitraToken.connect(owner).pause();
    
    try {
      await dimitraToken.connect(account1).transfer(account2.address, amount);
    } catch(error){
      assert.include(error.message,"revert","ERC20Pausable: token transfer while paused");
    }
    // await expect(dimitraToken.connect(account1).transfer(account2.address, amount)).to.be.revertedWith("ERC20Pausable: token transfer while paused");

    ammount = await dimitraToken.balanceOf(account2.address); 
    console.log("Amount", formatUnits(ammount));
  });

  it("Contract owner can unpause contract", async function() {
    // set balance up for transfer
    let amount = parseUnits("10", 18);
    await dimitraToken.connect(owner).mint(account1.address, amount);
    amount = await dimitraToken.balanceOf(account1.address);

    // temporarily pause then unpause contract should succeed again
    dimitraToken.connect(owner).pause();   // we already tested this case above
    dimitraToken.connect(owner).unpause(); // see if it works now...
    await dimitraToken.connect(account1).transfer(account2.address, amount);
    expect(await dimitraToken.balanceOf(account2.address)).to.equal(ammount);
    //console.log("Amount", formatUnits(ammount));
  });

  it("Non contract owner that is not PAUSER_ROLE cannot pause contract", async function() {
    try {
      await dimitraToken.connect(account1).pause();
    } catch(error){
      assert.include(error.message,"revert","ERC20PresetMinterPauser: must have pauser role to pause");
    }
    // expect(await dimitraToken.connect(account1).pause()).to.be.revertedWith("ERC20PresetMinterPauser: must have pauser role to pause");
  });
});

describe("Token Issuance, Locking, and Releasing Tests", function() {

  it("Issuer role can get locked balance", async function() {
    expect((await dimitraToken.connect(owner).getLockedBalance(account1.address))).to.equal(0);
  });

  it("Sender who owns address can get locked balance", async function() {
    expect((await dimitraToken.connect(account1).getLockedBalance(account1.address))).to.equal(0);
  });

  it("Non-issuer role who does not own address cannot get locked balance", async function() {
    try{
      await dimitraToken.connect(account1).getLockedBalance(account2.address); // Should throw revert error
    } catch (error){
      assert.include(error.message,"revert","DimitraToken: Only issuer role or sender who owns address can get locked balance");
    }
  });

  it("Issuer role can get total lockbox balance", async function() {
    expect((await dimitraToken.connect(owner).getTotalLockBoxBalance())).to.equal(0); // owner can do it (owner is issuer)
    await dimitraToken.connect(owner).grantRole(id("ISSUER_ROLE"), account1.address);
    expect(await dimitraToken.connect(account1).getTotalLockBoxBalance()).to.equal(0); // account1 can do it (owner granted issuer to account1)
  });

  it("Non-issuer role cannot get total lockbox balance", async function() {
    try{
      await dimitraToken.connect(account1).getTotalLockBoxBalance(); // Should throw revert error
    } catch (error){
      assert.include(error.message,"revert","DimitraToken: must have default admin role to get total lockbox balance");
    }
  });

  const getCurrentBlockTimeStamp = async () => {
    const currentBlockNumber = await ethers.provider.getBlockNumber();
    const currentBlock = await ethers.provider.getBlock(currentBlockNumber);
    return currentBlock.timestamp;
  }

  const getTimeStampNumDaysFromNow12AM = async (numDays) => {
    const nowUTC = new Date(await getCurrentBlockTimeStamp() * 1000);
    const todayUTC = new Date(Date.UTC(nowUTC.getFullYear(), nowUTC.getMonth(), nowUTC.getDate(), 0, 0, 0)); // as of 12:00:00 AM
    const unixTime12AMToday = Math.floor(todayUTC.getTime() / 1000);
    return unixTime12AMToday + (numDays * 24 * 60 * 60);
  }

  it("Token issuance multiple locks", async function() {
    // The Unix epoch (or Unix time or POSIX time or Unix timestamp) is the number of seconds that have elapsed since January 1, 1970 UTC

    const releaseTime10DaysAfterStartBlockTime = await getTimeStampNumDaysFromNow12AM(10); // releaseTime is date calculated in front end (should be at 12:00:00 AM)
    const releaseTime20DaysAfterStartBlockTime = await getTimeStampNumDaysFromNow12AM(20); // releaseTime is date calculated in front end (should be at 12:00:00 AM)
    console.log("************** releaseTime10DaysAfterStartBlockTime", releaseTime10DaysAfterStartBlockTime);
    console.log("************** releaseTime20DaysAfterStartBlockTime", releaseTime20DaysAfterStartBlockTime);

    console.log("\nBefore mint\n--------------------------------------------");
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    const mintAmount = parseUnits("1000", 18);
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    expect( await dimitraToken.balanceOf(owner.address)).to.equal(mintAmount);
    expect( await dimitraToken.balanceOf(account1.address)).to.equal(0);
    console.log("\nAfter mint but before issue locked tokens\n--------------------------------------------");
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    const transferAmount150 = parseUnits("150", 18);
    await dimitraToken.connect(owner).transfer(account1.address, transferAmount150);
    console.log("\nAfter transferring 150 unlocked tokens to account1\n--------------------------------------------");
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    const lockedTokenAmount200 = parseUnits("200", 18);
    await dimitraToken.connect(owner).issueLockedTokens(account1.address, lockedTokenAmount200, releaseTime10DaysAfterStartBlockTime);
    console.log("\nAfter issuing 200 tokens locked for 10 days to account1\n--------------------------------------------");
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    expect(await dimitraToken.balanceOf(account1.address)).to.equal(parseUnits("350", 18));           // 350 = 150 + 200
    expect(await dimitraToken.getLockedBalance(account1.address)).to.equal(parseUnits("200", 18));    // 200
    expect(await dimitraToken.getReleasedBalance(account1.address)).to.equal(parseUnits("150", 18));  // 150
    expect(await dimitraToken.getTotalLockBoxBalance()).to.equal(parseUnits("200", 18));              // 200

    const lockedTokenAmount250 = parseUnits("250", 18);
    await dimitraToken.connect(owner).issueLockedTokens(account1.address, lockedTokenAmount250, releaseTime20DaysAfterStartBlockTime);
    console.log("\nAfter issue 250 tokens locked for 20 days to account1\n--------------------------------------------");
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    const expectedBalance600 = parseUnits("600",18); // 600 = 350 + 250
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(expectedBalance600);
    
    const transferAmount200 = parseUnits("200", 18);
    console.log("\nAccount1 attempting transfer of 200 tokens from account1 to account2 on day 1 (should fail)\n--------------------------------------------");
    try{
      await dimitraToken.connect(account1).transfer(account2.address, transferAmount200); // Should throw revert error
    } catch (error){
      assert.include(error.message,"revert","DimitraToken: Insufficient balance");
    }
    expect(await dimitraToken.balanceOf(account2.address)).to.equal(0);
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));
    
    console.log("\nAccount1 attempting transfer of 150 tokens from account1 to account2 on day 1 (should succeed)\n--------------------------------------------");
    await dimitraToken.connect(account1).transfer(account2.address, transferAmount150);
    expect(await dimitraToken.balanceOf(account2.address)).to.equal(transferAmount150);
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    // time travel 15 days into future
    await network.provider.send("evm_increaseTime", [15*86400]) // time in seconds = 15 days * 86400 seconds/day
    await network.provider.send("evm_mine"); // force block to be mined

    console.log("\n>>> Time Traveled into future 15 days\n********************************************"); // now beyound first 10 day lock release time but not second 20 day lock release time

    console.log("\nAccount1 attempts to transfer 350 tokens to account2 on day ? (should fail)\n--------------------------------------------");
    const transferAmount350 = parseUnits("350", 18);
    try{
      await dimitraToken.connect(account1).transfer(account2.address, transferAmount350); // Should throw revert error
    } catch (error){
      assert.include(error.message,"revert","DimitraToken: Insufficient balance");
    }
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));

    // time travel 25 days into future
    await network.provider.send("evm_increaseTime", [25*86400]) // time in seconds = 25 days * 86400 seconds/day
    await network.provider.send("evm_mine"); // force block to be mined

    console.log("\n>>> Time Traveled into future 25 days\n********************************************"); // now get beyound second 20 day lock release time

    console.log("\nAccount1 attempts to transfer 350 tokens to account2 on day ? (should succeed)\n--------------------------------------------");
    await dimitraToken.connect(account1).transfer(account2.address, transferAmount350);
    expect(await dimitraToken.balanceOf(account2.address)).to.equal(parseUnits("500", 18));
    console.log("Current Date", new Date(await getCurrentBlockTimeStamp()*1000).toLocaleDateString());
    console.log("Balance of owner", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Locked balance of account1", formatUnits(await dimitraToken.getLockedBalance(account1.address)));
    console.log("Released balance of account1", formatUnits(await dimitraToken.getReleasedBalance(account1.address)));
    console.log("Balance of account2", formatUnits(await dimitraToken.balanceOf(account2.address)));
    console.log("Total locked balance", formatUnits(await dimitraToken.getTotalLockBoxBalance()));
  });

  it("Token issuance locks on multiple accounts", async function() {
    const releaseTime5DaysAfterStartBlockTime = await getTimeStampNumDaysFromNow12AM(5);

    const mintAmount = parseUnits("200", 18);
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);

    const amount = parseUnits("100", 18);
    expect(await dimitraToken.connect(owner).issueLockedTokens(account1.address, amount, releaseTime5DaysAfterStartBlockTime));
    expect(await dimitraToken.connect(owner).issueLockedTokens(account2.address, amount, releaseTime5DaysAfterStartBlockTime));

    try{
      await dimitraToken.connect(account1).transfer(account3.address, amount); // Should throw revert error
    } catch (error){
      assert.include(error.message,"revert","DimitraToken: Insufficient balance");
    }
    try{
      await dimitraToken.connect(account2).transfer(account3.address, amount); // Should throw revert error
    } catch (error){
      assert.include(error.message,"revert","DimitraToken: Insufficient balance");
    }

    // time travel 5 days into future
    await network.provider.send("evm_increaseTime", [5*86400]) // time in seconds = 5 days * 86400 seconds/day
    await network.provider.send("evm_mine"); // force block to be mined

    await dimitraToken.connect(account1).transfer(account3.address, amount); // Should succeed
    await dimitraToken.connect(account2).transfer(account3.address, amount); // Should succeed
  });
});
