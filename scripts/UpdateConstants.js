const dotenv = require("dotenv");
const { network, ethers } = require("hardhat");
const GB = require("./globalvariables");
const fs = require("fs");
const { contractAddress } = require("../constants");
const path = require('node:path');
dotenv.config();

const ABI_FILE_PATH = "./constants/abi.json";
const ADDRESS_FILE_PATH = "./constants/contractAddress.json";
const ROUND_FILE_PATH = "./constants/englandRounds2022.json";
const ROUND_RAW_FILE_PATH = "./constants/englandRounds2022Raw.json";
const ABI_ARTIFACTS = "./artifacts/contracts/";

const CONTRACTS = [{ name: "blackBox", factory: "BlackBox" }, { name: "feeSharingSystem", factory: "FeeSharingSystem" },
{ name: "blackBoxInfo", factory: "BlackBoxInfo" }, { name: "feeToken", factory: "FeeToken" }, { name: "platformToken", factory: "PlatformToken" }];

async function addAbisFirstTime() {
    if (process.env.IS_UPDATE_CONSTANTS === "true") {
        const chainId = network.config.chainId;
        const FormatTypes = ethers.utils.FormatTypes.json;
        const contracts = {};
        var abis = {};

        // contracts: {name: contract}
        for (let i = 0; i < CONTRACTS.length; i++) {
            const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]]);
            contracts[CONTRACTS[i].name] = contract;
        }
        console.log(contracts);

        var abisAllchain = fs.readFileSync(ABI_FILE_PATH, 'utf8');
        CONTRACTS.forEach(obj => {
            const currentAbi = JSON.parse(fs.readFileSync(path.join(ABI_ARTIFACTS, `${obj.factory}.sol/${obj.factory}.json`), "utf8"));
            abis[obj.factory] = currentAbi.abi;
        })
        abisAllchain = { [chainId]: abis };

        fs.writeFileSync(ABI_FILE_PATH, JSON.stringify(abisAllchain));

    }
    console.log("Done add abis");
}

async function updateAbis() {

}

addAbisFirstTime();