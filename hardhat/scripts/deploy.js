async function main() {
    // We get the contract to deploy
    const contractFactory = await ethers.getContractFactory("DimitraToken");
    const DMTRToken = await contractFactory.deploy();
    await DMTRToken.deployed();
  
    console.log("DMTRToken deployed to:", DMTRToken.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });