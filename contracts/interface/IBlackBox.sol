//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBlackBox {
    //Deposit token to buy lootbox
    function depositToken(uint256 _amount) external;

    //Buy lootbox
    function buyLootBox(
        uint256 _number,
        uint256 _entranceFee,
        uint256 _matchId,
        uint256 _side
    ) external;

    function buyLootBoxes(
        uint256[] calldata _numbers,
        uint256[] calldata _entranceFees,
        uint256[] calldata _matchIds,
        uint256[] calldata _sides
    ) external;

    function withdrawFeeToken(uint256 _amount) external;

    function withdrawPlatformToken(uint256 _amount) external;

    // Get functions

    function getPositionsByMatchId(uint256 _matchId)
        external
        view
        returns (uint256[] memory);

    function getLeftPositionsByMatchId(uint256 _matchId)
        external
        view
        returns (uint256[] memory);

    function getRightPositionsByMatchId(uint256 _matchId)
        external
        view
        returns (uint256[] memory);

    function getTotalAmountByMatchId(uint256 _matchId)
        external
        view
        returns (uint256);

    function getLeftAmountByMatchId(uint256 _matchId)
        external
        view
        returns (uint256);

    function getRightAmountByMatchId(uint256 _matchId)
        external
        view
        returns (uint256);

    function getAccuFee() external view returns (uint256);
}
