//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract BlackBoxInfo is Ownable {
    struct UserInfo {
        uint256 feeTokenRewards;
        uint256 platformTokenRewards;
    }

    mapping(address => UserInfo) public addressToUserInfo;

    address public blackBox;
    bool public isSetBlackBox;

    event AddRound(
        uint256 indexed roundIndex,
        uint256 indexed roundId,
        uint256 indexed deadline
    );

    function setBlackBoxAddress(address _blackBoxAddress) external onlyOwner {
        require(!isSetBlackBox, "Already setBlackBox");
        isSetBlackBox = true;
        blackBox = _blackBoxAddress;
    }

    function setFeeTokenRewards(address _userAddress, uint256 _amount)
        external
        returns (bool)
    {
        require(msg.sender == blackBox, "Not from blackbox contract");
        addressToUserInfo[_userAddress].feeTokenRewards = _amount;
        return true;
    }

    function setPlatformTokenRewards(address _userAddress, uint256 _amount)
        external
        returns (bool)
    {
        require(msg.sender == blackBox, "Not from blackbox contract");
        addressToUserInfo[_userAddress].platformTokenRewards = _amount;
        return true;
    }

    function addFeeTokenRewards(address _userAddress, uint256 _amount)
        external
        returns (bool)
    {
        require(msg.sender == blackBox, "Not from blackbox contract");
        addressToUserInfo[_userAddress].feeTokenRewards += _amount;
        return true;
    }

    function addPlatformTokenRewards(address _userAddress, uint256 _amount)
        external
        returns (bool)
    {
        require(msg.sender == blackBox, "Not from blackbox contract");
        addressToUserInfo[_userAddress].platformTokenRewards += _amount;
        return true;
    }

    function getFeeTokenRewardsByAddress(address _userAddress)
        external
        view
        returns (uint256)
    {
        return addressToUserInfo[_userAddress].feeTokenRewards;
    }

    function getPlatformTokenRewardsByAddress(address _userAddress)
        external
        view
        returns (uint256)
    {
        return addressToUserInfo[_userAddress].platformTokenRewards;
    }
}
