const EscrowFactory = artifacts.require("EscrowFactory");

module.exports = function(deployer) {
  // We ONLY deploy the Factory!
  // We do NOT deploy the Escrow contract.
  deployer.deploy(EscrowFactory);
};