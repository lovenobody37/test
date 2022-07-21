const dotenv = require("dotenv");
const { network, ethers } = require("hardhat");
const GB = require("./globalvariables");
const fs = require("fs");
const { contractAddress } = require("../constants")
dotenv.config();

const ABI_FILE_PATH = "./constants/abi.json";
const ADDRESS_FILE_PATH = "./constants/contractAddress.json";
const ROUND_FILE_PATH = "./constants/englandRounds2022.json";
const ROUND_RAW_FILE_PATH = "./constants/englandRounds2022Raw.json";
const ABI_ARTIFACTS = "./artifacts/contracts/BlackBox.sol/BlackBox.json";

async function updateAbi() {
    if (process.env.IS_UPDATE_CONSTANTS === "true") {
        const blackBox = await ethers.getContractAt("BlackBox", contractAddress.BlackBox)
        const feeSharingSystem = await ethers.getContractAt("FeeSharingSystem", contractAddress.FeeSharingSystem)
        const blackBoxInfo = await ethers.getContractAt("BlackBoxInfo", contractAddress.BlackBoxInfo)
        const feeToken = await ethers.getContractAt("FeeToken", contractAddress.FeeToken)
        const platformToken = await ethers.getContractAt("PlatformToken", contractAddress.PlatformToken)

        const data = JSON.parse(fs.readFileSync(ABI_ARTIFACTS, "utf8"));
        const FormatTypes = ethers.utils.FormatTypes.json;
        const input["BlackBox"] =  data.abi;
        //     data["BlackBox"] = blackBox.interface.format(FormatTypes);
        fs.writeFileSync(ABI_FILE_PATH, JSON.stringify(input));
        console.log(data.abi);
        console.log(typeof data.abi);
    }
    console.log(typeof process.env.IS_UPDATE_CONSTANTS)
}

updateAbi();