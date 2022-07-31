const { network, ethers } = require("hardhat");
const GB = require("./globalvariables");
const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");
const { contractAddress } = require("../constants");
const path = require('node:path');
dotenv.config();


const ABI_FILE_PATH = "./constants/abi.json";
const ADDRESS_FILE_PATH = "./constants/contractAddress.json";
const ROUND_FILE_PATH = "./constants/englandRounds2022.json";
const ROUND_RAW_FILE_PATH = "./constants/englandRounds2022Raw.json";
const ABI_ARTIFACTS = "./artifacts/contracts/";
const REACT_CONSTANTS = "../frontend-react/blackbox-product/src/constants/"

const CONTRACTS = [{ name: "blackBox", factory: "BlackBox" }, { name: "feeSharingSystem", factory: "FeeSharingSystem" },
{ name: "blackBoxInfo", factory: "BlackBoxInfo" }, { name: "feeToken", factory: "FeeToken" }, { name: "platformToken", factory: "PlatformToken" }];

async function deploy() {
    console.log(network.config);
    const myAccounts = await ethers.getSigners();
    const chainId = network.config.chainId;

    const feeTokenFactory = await ethers.getContractFactory("FeeToken");
    const platformTokenFactory = await ethers.getContractFactory("PlatformToken");
    const feeSharingSystemFactory = await ethers.getContractFactory("FeeSharingSystem");
    const blackBoxInfoFactory = await ethers.getContractFactory("BlackBoxInfo");
    const blackBoxFactory = await ethers.getContractFactory("BlackBox");

    const feeToken = await feeTokenFactory.deploy(myAccounts[0].address, GB.CAP.mul(GB.FEE_TOKEN_DECIMAL));
    const platformToken = await platformTokenFactory.deploy(myAccounts[0].address, GB.CAP.mul(GB.PLATFORM_TOKEN_DECIMAL));
    const feeSharingSystem = await feeSharingSystemFactory.deploy(platformToken.address, feeToken.address);
    const blackBoxInfo = await blackBoxInfoFactory.deploy();
    const blackBox = await blackBoxFactory.deploy(feeToken.address, platformToken.address, feeSharingSystem.address, blackBoxInfo.address, GB.FEE_PERCENTAGE);

    console.log("adding address constants");

    const FormatTypes = ethers.utils.FormatTypes.json;
    var contractAddressAllChain = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    var contractAddress = {};

    contractAddress["BlackBox"] = blackBox.address;
    contractAddress["BlackBoxInfo"] = blackBoxInfo.address;
    contractAddress["FeeSharingSystem"] = feeSharingSystem.address;
    contractAddress["PlatformToken"] = platformToken.address;
    contractAddress["FeeToken"] = feeToken.address;

    contractAddressAllChain = { [chainId]: contractAddress }

    fs.writeFileSync(ADDRESS_FILE_PATH, JSON.stringify(contractAddressAllChain), "utf8");
    fs.writeFileSync(path.join(REACT_CONSTANTS, "contractAddress.json"), JSON.stringify(contractAddressAllChain), "utf8");
    console.log("Done adding address constants");

}

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

        var abisAllchain = fs.readFileSync(ABI_FILE_PATH, 'utf8');
        CONTRACTS.forEach(obj => {
            const currentAbi = JSON.parse(fs.readFileSync(path.join(ABI_ARTIFACTS, `${obj.factory}.sol/${obj.factory}.json`), "utf8"));
            abis[obj.factory] = currentAbi.abi;
        })


        fs.writeFileSync(ABI_FILE_PATH, JSON.stringify(abis));
        fs.writeFileSync(path.join(REACT_CONSTANTS, "abi.json"), JSON.stringify(abis));
    }
    console.log("Done add abis");
}



async function setAddress() {
    const myAccounts = await ethers.getSigners();
    const chainId = network.config.chainId;
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const feeSharingSystem = await ethers.getContractAt("FeeSharingSystem", contractAddress[chainId].FeeSharingSystem, myAccounts[0]);
    const blackBoxInfo = await ethers.getContractAt("BlackBoxInfo", contractAddress[chainId].BlackBoxInfo, myAccounts[0]);
    await feeSharingSystem.setBlackBoxAddress(contractAddress[chainId].BlackBox);
    await blackBoxInfo.setBlackBoxAddress(contractAddress[chainId].BlackBox);
    console.log("Done Setting");
}

async function setStakingFeeAndPlatformTokenRate() {
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]], myAccounts[0]);
        contracts[CONTRACTS[i].name] = contract;
    }
    const stakingFeeRate = GB.STAKING_FEE_RATE
    const platformTokenRate = GB.DISTRIBUTION_RATE.mul(GB.PLATFORM_TOKEN_DECIMAL)
    await contracts["feeSharingSystem"].setStakingFeePercentage(stakingFeeRate)
    await contracts["blackBox"].setPlatformTokenRewardsPerRound(platformTokenRate)
}

async function addRounds() {
    const myAccounts = await ethers.getSigners();
    const chainId = network.config.chainId;
    const contractAddress = JSON.parse(fs.readFileSync(ADDRESS_FILE_PATH, "utf8"));
    const blackBox = await ethers.getContractAt("BlackBox", contractAddress[chainId].BlackBox, myAccounts[0]);
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


// Setup for Test
async function distributeToken() {
    // send FeeToken 10M/wallet to 10 wallets and platformToken to blackBox
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]], myAccounts[0]);
        contracts[CONTRACTS[i].name] = contract;
    }
    const myBalance = await contracts["feeToken"].balanceOf(myAccounts[0].address);
    for (let i = 1; i < 10; i++) {
        await contracts["feeToken"].transfer(myAccounts[i].address, myBalance.div(10));
    }
    console.log(await contracts["feeToken"].balanceOf(myAccounts[0].address));
    await contracts["platformToken"].transfer(contractAddress[chainId]["BlackBox"], await contracts["platformToken"].balanceOf(myAccounts[0].address));
    console.log(await contracts["platformToken"].balanceOf(myAccounts[0].address));

}


async function buyBlackBoxes() {
    const tenBigNum = ethers.BigNumber.from("10")
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]]);
        contracts[CONTRACTS[i].name] = contract;
    }
    //Buy BlackBox
    const _amount = (ethers.BigNumber.from("10000")).mul((GB.FEE_TOKEN_DECIMAL))
    console.log(_amount)
    for (let i = 0; i < 10; i++) {
        for (let j = 10; j < 20; j++) {
            let result = ((j + i) % 2) + 1;
            await contracts["feeToken"].connect(myAccounts[i]).approve(contractAddress[chainId]["BlackBox"], _amount);
            let success = await contracts["blackBox"].connect(myAccounts[i]).buyBlackBox(_amount, j, result);
        }
        console.log(await contracts["feeToken"].balanceOf(myAccounts[i].address));
    }

    //   console.log(_amount);
    //   await contracts["feeToken"].connect(myAccounts[0]).approve(contractAddress[chainId]["BlackBox"], 10);
    //await contracts["blackBox"].connect(myAccounts[0]).buyBlackBox(_amount, 0, 1);
}

async function manualBuyBlackBox() {
    const roundIndex = 10
    const result = 1
    const _amount = (ethers.BigNumber.from("1000")).mul((GB.FEE_TOKEN_DECIMAL))


    const tenBigNum = ethers.BigNumber.from("10")
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]]);
        contracts[CONTRACTS[i].name] = contract;
    }
    //Buy BlackBox
    await contracts["feeToken"].connect(myAccounts[0]).approve(contractAddress[chainId]["BlackBox"], _amount);
    await contracts["blackBox"].connect(myAccounts[0]).buyBlackBox(_amount, roundIndex, result);
    console.log(await contracts["feeToken"].balanceOf(myAccounts[0].address));
}


async function manualSetResult() {
    const roundIndex = 0
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]], myAccounts[0]);
        contracts[CONTRACTS[i].name] = contract;
    }
    const roundFilter = contracts["blackBox"].filters.AddRound(roundIndex, null, null);
    const roundFilterData = await contracts["blackBox"].queryFilter(roundFilter);
    const roundId = roundFilterData[0].args.roundId
    await contracts["blackBox"].setResult((roundId), 2)
    console.log(roundFilterData[0].args.roundId)
}

async function loopSetResult() {
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]], myAccounts[0]);
        contracts[CONTRACTS[i].name] = contract;
    }
    for (let i = 10; i < 20; i++) {
        const roundIndex = i
        const roundFilter = contracts["blackBox"].filters.AddRound(roundIndex, null, null);
        const roundFilterData = await contracts["blackBox"].queryFilter(roundFilter);
        const roundId = roundFilterData[0].args.roundId
        await contracts["blackBox"].setResult((roundId), (i % 3) + 1)
    }
}

async function manualUpdateReward() {
    const roundIndex = 0
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]], myAccounts[0]);
        contracts[CONTRACTS[i].name] = contract;
    }
    const roundFilter = contracts["blackBox"].filters.AddRound(roundIndex, null, null);
    const roundFilterData = await contracts["blackBox"].queryFilter(roundFilter);
    const roundId = roundFilterData[0].args.roundId
    const roundDetailsData = await contracts["blackBox"].manualUpdateRewardByRoundId(roundId);
    console.log(roundDetailsData)
}


async function test() {
    const chainId = network.config.chainId;
    const myAccounts = await ethers.getSigners();
    const contracts = {};
    for (let i = 0; i < CONTRACTS.length; i++) {
        const contract = await ethers.getContractAt(CONTRACTS[i]["factory"], contractAddress[chainId][CONTRACTS[i]["factory"]], myAccounts[0]);
        contracts[CONTRACTS[i].name] = contract;
    }


    const updateRewardsFilter = contracts["blackBox"].filters.UpdateRewardPerAddress(myAccounts[0].address, null, null);
    const updateRewardsFilterData = await contracts["blackBox"].queryFilter(updateRewardsFilter);
    console.log(updateRewardsFilterData)
    //    console.log(ethers.BigNumber.from(GB.CAP.toString(), GB.FEE_TOKEN_DECIMAL))
    //    console.log(ethers.utils.parseUnits(GB.CAP.toString(), GB.FEE_TOKEN_DECIMAL))
    //    console.log(ethers.utils.parseUnits(GB.CAP.toString(), GB.PLATFORM_TOKEN_DECIMAL))
}



async function testFile() {
    const data = fs.readFileSync(REACT_CONSTANTS, 'utf8');
    console.log(data)
}

async function doneAllShit() {
    deploy();
    addAbisFirstTime();
    setAddress();
    setStakingFeeAndPlatformTokenRate();
    addRounds();
    distributeToken();
    buyBlackBoxes();
    manualSetResult();
    loopSetResult();
}

// testFile();
// deploy();
// addAbisFirstTime();
// setAddress();
// setStakingFeeAndPlatformTokenRate();
// addRounds();
// distributeToken();
//manualBuyBlackBox();
// buyBlackBoxes();
// manualSetResult();
// loopSetResult();
manualUpdateReward();
// test();

// doneAllShit();
