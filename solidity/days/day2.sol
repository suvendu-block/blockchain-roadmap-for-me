// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;






contract newCalculater {
    uint256 constant MIN_AMOUNT= 10;

    address public immutable owner;


    uint256 private balence;


    constructor () {
        owner = msg.sender;
    }




    function Deposit () external  payable {
        if (msg.value < MIN_AMOUNT) {
            revert("TOO SMALL");
        }
        balence += msg.value;
    }
    


    function getBlance() public view returns (uint256) {
        return balence;
    }



    function bonus(uint256 amount) public pure returns (uint256) {
        return amount /10;
    }




    function SplitInTwo (uint256 amount) public pure returns (uint256 half , uint256 rest) {
        half = amount / 2;
        rest = amount - half;
    }




    function sumTo(uint256 n) public pure returns (uint256) {
        return n * (n + 1) / 2;
    }


    function sumTwoWhile (uint256 n) public pure returns (uint256 sum) {
        uint256 i = 1;
        while (i <=n) {
            sum +=i;
            i++;
        }
    }




    function secrectNote () private pure returns (string memory) {
        return "Save a little every day";
    }
    
}