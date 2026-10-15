// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Tip {
    

    address public immutable owner;

    struct TipEntry {
        address from;
        uint256 amount;
        uint256 timestamp;
    }

    TipEntry[] public tips;
    mapping(address => uint256) public tipsSentByUser;

  
    event Tipped(address indexed from, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount);

    

    constructor() {
        owner = msg.sender;
    }

    

    modifier onlyOwner() {
        require(msg.sender == owner, "TipJar: caller is not the owner");
        _;
    }

    

    function tip() external payable {
        require(msg.value > 0, "TipJar: tip amount must be greater than zero");

        tips.push(
            TipEntry({
                from: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        tipsSentByUser[msg.sender] += msg.value;

        emit Tipped(msg.sender, msg.value, block.timestamp);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "TipJar: contract has no funds to withdraw");

        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "TipJar: failed to send ether to owner");

        emit Withdrawn(owner, balance);
    }

    

    function getTipCount() external view returns (uint256) {
        return tips.length;
    }

    function getTotalTips() external view returns (uint256) {
        return address(this).balance;
    }

    function getTips()
        external
        view
        returns (
            address[] memory fromAddresses,
            uint256[] memory amounts,
            uint256[] memory timestamps
        )
    {
        uint256 length = tips.length;

        fromAddresses = new address[](length);
        amounts = new uint256[](length);
        timestamps = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            fromAddresses[i] = tips[i].from;
            amounts[i] = tips[i].amount;
            timestamps[i] = tips[i].timestamp;
        }
    }

    function getUserTipCount(address user)
        external
        view
        returns (uint256)
    {
        return tipsSentByUser[user];
    }
}
