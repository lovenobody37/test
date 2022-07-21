const hre = require("hardhat");

const FEE_TOKEN_NAME = "USDC";
const TOKEN_SYMBOL = "USDC";
const FEE_TOKEN_DECIMAL = 10 ** 6;

const PLATFORM_TOKEN_NAME = "Blackbox";
const PLATFORM_TOKEN_SYMBOL = "BLACK";
const PLATFORM_TOKEN_DECIMAL = 10 ** 18;

const DISTRIBUTION_RATE = 10000;
const FEE_PERCENTAGE_DECIMAL = 10 ** 3;
const FEE_PERCENTAGE = 2 * FEE_PERCENTAGE_DECIMAL; // 2% from winners and 2 % from losers
const PREMINT_RECEIVER = network.config.accounts;
const CAP = (1 * 10 ** 7); // 10 millions  

module.exports = {
    FEE_TOKEN_NAME, TOKEN_SYMBOL, FEE_TOKEN_DECIMAL, PLATFORM_TOKEN_NAME, PLATFORM_TOKEN_SYMBOL,
    PLATFORM_TOKEN_DECIMAL, DISTRIBUTION_RATE, FEE_PERCENTAGE_DECIMAL, FEE_PERCENTAGE, PREMINT_RECEIVER, CAP
}


// platform and feetoken cannot put directly 18 decimal due to overflow 
//block.timestamp has no millesecond return bignumber type not date type 
//always getTime from blockchain to adjust before adding to addMatch 
//ethers.utils.parseUnits("10", 18);
// --grep for testing specific test
// network.config.url for current network 
//console.log(network.config);
//block.timestamp has no millisecond 
// await ethers.getSigners(); can work with testnet