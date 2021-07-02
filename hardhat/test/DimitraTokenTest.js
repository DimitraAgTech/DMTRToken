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
    expect(formatUnits(await dimitraToken.cap())).to.equal(formatUnits(parseUnits("1000000000", 18)));
  })

  it("Deployment should assign owner balance of zero", async function() {
    expect(await dimitraToken.balanceOf(owner.address)).to.equal(0);
  });
});

describe("Token Transfer Tests", function () {
  it("Should transfer tokens between accounts if balance is sufficient", async function() {
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

  it("Contract owner can grant minter role", async function() {
    //console.log("Balance before minting", formatUnits(await dimitraToken.balanceOf(account1.address)));
    await dimitraToken.connect(owner).grantRole(id("MINTER_ROLE"), account1.address);
    await dimitraToken.connect(account1).mint(account1.address, parseUnits("1000", 18));
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(parseUnits("1000", 18));
    //console.log("Balance after minting", formatUnits(await dimitraToken.balanceOf(account1.address)));
  })

  it("Non contract owner cannot grant minter role", async function() {
    await expect(dimitraToken.connect(account1).grantRole(id("MINTER_ROLE"), account2.address)).to.be.reverted;
  });
});

describe("Token Minting Tests", function() {
  it("Non owner that is not MINTER_ROLE cannot mint tokens", async function() {
    const mintAmount = '1000000000000000000';
    await expect(dimitraToken.connect(account1).mint(account1.address, mintAmount)).to.be.reverted;
  });
  
  it("Minted tokens can be assigned by owner to owner address", async function() {
    const mintAmount = '1000000000000000000';
    const balanceBeforeMinting = await dimitraToken.balanceOf(owner.address);
    //console.log("balanceBeforeMinting", formatUnits(balanceBeforeMinting));
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    const balanceAfterMinting = await dimitraToken.balanceOf(owner.address);
    //console.log("balanceAfterMinting", formatUnits(balanceAfterMinting));
    await expect(balanceAfterMinting).to.equal(balanceBeforeMinting + mintAmount);
  });

  it("Minted tokens can be assigned by owner to another address", async function() {
    const mintAmount = '1000000000000000000';
    const balanceBeforeMinting = await dimitraToken.balanceOf(account1.address);
    //console.log("balanceBeforeMinting", formatUnits(balanceBeforeMinting));
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    const balanceAfterMinting = await dimitraToken.balanceOf(account1.address);
    //console.log("balanceAfterMinting", formatUnits(balanceAfterMinting));
    await expect(balanceAfterMinting).to.equal(balanceBeforeMinting + mintAmount);
  });

  it("Minting tokens increments total supply accordingly", async function() {
    const totalSupplyBeforeMinting = await dimitraToken.totalSupply();
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    const totalSupplyAfterMinting = await dimitraToken.totalSupply();
    await expect(totalSupplyAfterMinting).to.equal(totalSupplyBeforeMinting + mintAmount);
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
    let balance = await dimitraToken.balanceOf(account1.address);
    await expect(dimitraToken.connect(owner).burnFrom(account1.address, balance)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });

  it("Non contract owner cannot burn tokens of owner without allowance approval", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(owner.address, mintAmount);
    let balance = await dimitraToken.balanceOf(owner.address);
    await dimitraToken.connect(owner).grantRole(id("BURNER_ROLE"), account1.address);
    await expect(dimitraToken.connect(account1).burnFrom(owner.address, balance)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });

  it("An account cannot burn tokens of another without allowance approval", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    let balance = await dimitraToken.balanceOf(account1.address);
    await dimitraToken.connect(owner).grantRole(id("BURNER_ROLE"), account2.address);
    await expect(dimitraToken.connect(account2).burnFrom(account1.address, balance)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });

  it("An account can burn tokens of another if approved", async function() {
    const mintAmount = '1000000000000000000';
    await dimitraToken.connect(owner).mint(account1.address, mintAmount);
    let balance = await dimitraToken.balanceOf(account1.address);
    await dimitraToken.connect(owner).grantRole(id("BURNER_ROLE"), account2.address);
    await dimitraToken.connect(account1).approve(account2.address, balance);
    await dimitraToken.connect(account2).burnFrom(account1.address, balance);
    expect(await dimitraToken.balanceOf(account1.address)).to.equal(0);
    //console.log("balance", formatUnits(await dimitraToken.balanceOf(account1.address)));
    //console.log("allowance", formatUnits(await dimitraToken.allowance(account1.address, account2.address)));
  });
});

describe("Token Pausing Tests", function() {
  it("Contract owner can pause contract", async function() {
    // set balance up for transfer
    let amount = parseUnits("10", 18);
    await dimitraToken.connect(owner).mint(account1.address, amount);
    amount = await dimitraToken.balanceOf(account1.address);

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
    await expect(dimitraToken.connect(account1).transfer(account2.address, amount)).to.be.revertedWith("ERC20Pausable: token transfer while paused");
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
    await expect(dimitraToken.connect(account1).pause()).to.be.revertedWith("ERC20PresetMinterPauser: must have pauser role to pause");
  });
});

describe("Token Deposit Locking and Triggering Withdrawing Tests", function() {
  it("Contract owner can lock a deposit to another address and then trigger its withdraw", async function() {
    // mint owner balance for releasing locked deposit from time lock to token holder
    let amount = parseUnits("1000", 18);
    await dimitraToken.connect(owner).mint(owner.address, amount);

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // lock deposit
    await expect(dimitraToken.connect(owner).lockDeposit(account1.address, amount, 5)).to.emit(dimitraToken, 'LogLockDeposit'); // 5 days

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after locking deposit but before time travel", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after locking deposit but before time travel", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // time travel 10 days into future
    await network.provider.send("evm_increaseTime", [10*86400]) // time in seconds = 10 days * 86400 seconds/day
    
    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after time travel but before triggering withdraw", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after time travel but before triggering withdraw", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // trigger withdraw
    await dimitraToken.connect(owner).triggerReleaseAllMatured();

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after triggering withdraw", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after triggering withdraw", formatUnits(await dimitraToken.balanceOf(account1.address)));

    expect(await dimitraToken.balanceOf(account1.address)).to.equal(amount);
  });

  it("Contract owner can lock a deposit to another address and but canot trigger its withdraw if NSF", async function() {
    // mint owner balance that is too small for releasing locked deposit from time lock to token holder
    let smallAmount = parseUnits("10", 18);
    await dimitraToken.connect(owner).mint(owner.address, smallAmount);

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // lock deposit
    let bigAmount = parseUnits("20", 18);
    await expect(dimitraToken.connect(owner).lockDeposit(account1.address, bigAmount, 5)).to.emit(dimitraToken, 'LogLockDeposit'); // 5 days

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after locking deposit but before time travel", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after locking deposit but before time travel", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // time travel 10 days into future
    await network.provider.send("evm_increaseTime", [10*86400]) // time in seconds = 10 days * 86400 seconds/day

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after time travel but before triggering withdraw", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after time travel but before triggering withdraw", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // trigger withdraw
    await expect(dimitraToken.connect(owner).triggerReleaseAllMatured()).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    
    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after triggering withdraw", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after triggering withdraw", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // mint more owner balance sufficient for releasing locked deposit from time lock to token holder
    let sufficientAmount = parseUnits("10", 18);
    await dimitraToken.connect(owner).mint(owner.address, sufficientAmount);

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after minting sufficient additional deposit", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after minting sufficient additional deposit", formatUnits(await dimitraToken.balanceOf(account1.address)));

    // trigger withdraw
    await dimitraToken.connect(owner).triggerReleaseAllMatured();

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after second triggering withdraw", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after second triggering withdraw", formatUnits(await dimitraToken.balanceOf(account1.address)));

    expect(await dimitraToken.balanceOf(account1.address)).to.equal(bigAmount);
  });
  
  it("Contract owner can lock multiple deposits to other addresses and then trigger their withdraw", async function() {
    // mint owner balance for locking deposits into time lock for token holder
    let amount1 = parseUnits("1000.0", 18);
    let amount2 = parseUnits("2000.0", 18)
    await dimitraToken.connect(owner).mint(owner.address, amount1.add(amount2));

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Balance of account2 after minting but before locking deposit", formatUnits(await dimitraToken.balanceOf(account2.address)));

    // lock deposits
    await expect(dimitraToken.connect(owner).lockDeposit(account1.address, amount1, 5)).to.emit(dimitraToken, 'LogLockDeposit'); // 5 days
    await expect(dimitraToken.connect(owner).lockDeposit(account2.address, amount2, 6)).to.emit(dimitraToken, 'LogLockDeposit'); // 6 days

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after locking deposits but before time travel", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after locking deposits but before time travel", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Balance of account2 after locking deposits but before time travel", formatUnits(await dimitraToken.balanceOf(account2.address)));

    // time travel 10 days into future
    await network.provider.send("evm_increaseTime", [10*86400]) // time in seconds = 10 days * 86400 seconds/day

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after time travel but before triggering withdraws", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after time travel but before triggering withdraws", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Balance of account2 after time travel but before triggering withdraws", formatUnits(await dimitraToken.balanceOf(account2.address)));

    // trigger multiple withdraws
    await dimitraToken.connect(owner).triggerReleaseAllMatured();

    console.log("*** Lock Box Count: ",         await (await dimitraToken.connect(owner).getLockBoxCount()).toString());
    console.log("*** Total Lock Box Balance: ", await (await dimitraToken.connect(owner).getTotalLockBoxBalance()).toString());
    console.log("Balance of owner    after triggering withdraws", formatUnits(await dimitraToken.balanceOf(owner.address)));
    console.log("Balance of account1 after triggering withdraws", formatUnits(await dimitraToken.balanceOf(account1.address)));
    console.log("Balance of account2 after triggering withdraws", formatUnits(await dimitraToken.balanceOf(account2.address)));

    expect(await dimitraToken.balanceOf(account1.address)).to.equal(amount1);
    expect(await dimitraToken.balanceOf(account2.address)).to.equal(amount2);
  });
    
});
