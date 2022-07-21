const { network, ethers } = require("hardhat");
const GB = require("./globalvariables");
const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const ABI_FILE_PATH = "./constants/abi.json";
const ADDRESS_FILE_PATH = "./constants/contractAddress.json";
const ROUND_FILE_PATH = "./constants/englandRounds2022.json";
const ROUND_RAW_FILE_PATH = "./constants/englandRounds2022Raw.json";
const ABI_ARTIFACTS = "./artifacts/contracts/BlackBox.sol/BlackBox.json";

async function deploy() {
    console.log(network.config);
    const myAccounts = await ethers.getSigners();
    //   const chainId = network;

    const feeTokenFactory = await ethers.getContractFactory("FeeToken");
    const platformTokenFactory = await ethers.getContractFactory("PlatformToken");
    const feeSharingSystemFactory = await ethers.getContractFactory("FeeSharingSystem");
    const blackBoxInfoFactory = await ethers.getContractFactory("BlackBoxInfo");
    const blackBoxFactory = await ethers.getContractFactory("BlackBox");

    const feeToken = await feeTokenFactory.deploy(myAccounts[0].address, GB.CAP);
    const platformToken = await platformTokenFactory.deploy(myAccounts[0].address, GB.CAP);
    const feeSharingSystem = await feeSharingSystemFactory.deploy(platformToken.address, feeToken.address);
    const blackBoxInfo = await blackBoxInfoFactory.deploy();
    const blackBox = await blackBoxFactory.deploy(feeToken.address, platformToken.address, feeSharingSystem.address, blackBoxInfo.address, GB.FEE_PERCENTAGE);

    console.log("updaing constants");

    const FormatTypes = ethers.utils.FormatTypes.json;
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const data = JSON.parse(fs.readFileSync(ABI_ARTIFACTS, "utf8"));

    contractAddress["BlackBox"] = blackBox.address;
    contractAddress["BlackBoxInfo"] = blackBoxInfo.address;
    contractAddress["FeeSharingSystem"] = feeSharingSystem.address;
    contractAddress["PlatformToken"] = platformToken.address;
    contractAddress["FeeToken"] = feeToken.address;

    /*    abi["BlackBox"] = blackBox.interface.format(FormatTypes);
       abi["BlackBoxInfo"] = blackBoxInfo.interface.format(FormatTypes);
       abi["FeeSharingSystem"] = feeSharingSystem.interface.format(FormatTypes);
       abi["PlatformToken"] = platformToken.interface.format(FormatTypes);
       abi["FeeToken"] = feeToken.interface.format(FormatTypes);
    */


    fs.writeFileSync(ADDRESS_FILE_PATH, JSON.stringify(contractAddress), "utf8");
    fs.writeFileSync(ABI_FILE_PATH, JSON.stringify(data.abi), "utf8");

    console.log("Done updating");

}

async function getContract() {
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const data = JSON.parse(fs.readFileSync(ABI_ARTIFACTS, "utf8"));
    const blackBox = await ethers.getContractAt("BlackBox", contractAddress.BlackBox);
    console.log(blackBox.address);
}

async function setAddress() {
    const myAccounts = await ethers.getSigners();
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const feeSharingSystem = await ethers.getContractAt("FeeSharingSystem", contractAddress.FeeSharingSystem, myAccounts[0]);
    const blackBoxInfo = await ethers.getContractAt("BlackBoxInfo", contractAddress.BlackBoxInfo, myAccounts[0]);
    await feeSharingSystem.setBlackBoxAddress(contractAddress.BlackBox);
    await blackBoxInfo.setBlackBoxAddress(contractAddress.BlackBox);
    console.log("Done Setting");
}

async function addRounds() {
    const myAccounts = await ethers.getSigners();
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const blackBox = await ethers.getContractAt("BlackBox", contractAddress.BlackBox, myAccounts[0]);
    const rounds = JSON.parse(fs.readFileSync(ROUND_RAW_FILE_PATH, "utf8"));
    for (let i = 0; i < rounds.response.length; i++) {
        const data = rounds.response;
        const roundId = data[i].fixture.id;
        const deadline = data[i].fixture.timestamp;
        await blackBox.addRound(roundId, deadline);
    };
}

async function getRoundsFromAPI() {
    const options = {
        method: 'GET',
        url: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
        params: { league: '39', season: '2022' },
        headers: {
            'X-RapidAPI-Key': process.env.RAPID_API_KEY || "",
            'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data);
        fs.writeFile(ROUND_RAW_FILE_PATH, JSON.stringify(response.data), (err) => console.log(err));
    }).catch(function (error) {
        console.error(error);
    });


}

async function convertedRoundsData() {
    const data = JSON.parse(fs.readFileSync(ROUND_RAW_FILE_PATH, "utf8"));
    const rounds = data.response;
    const newRounds = {}
    for (let i = 0; i < rounds.length; i++) {
        const id = rounds[i].fixture.id;
        newRounds[id] = rounds[i];
    }
    fs.writeFileSync(ROUND_FILE_PATH, JSON.stringify(newRounds));
}


async function test() {
    const myAccounts = await ethers.getSigners();
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const feeSharingSystem = await ethers.getContractAt("FeeSharingSystem", contractAddress.FeeSharingSystem, myAccounts[0]);
    const blackBoxInfo = await ethers.getContractAt("BlackBoxInfo", contractAddress.BlackBoxInfo, myAccounts[0]);
    const blackBoxInFeeSharing = await feeSharingSystem.blackBox();
    console.log(blackBoxInFeeSharing);
}

addRounds();