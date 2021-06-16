const DimitraToken = artifacts.require("DimitraToken");

module.exports = function(deployer) {
  deployer.deploy(DimitraToken);
};