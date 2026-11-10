// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;





contract SimpleStorage {
    uint256 favoriteNumber;


    function store(uint256 _favoriteNumber) public {
        favoriteNumber = _favoriteNumber; 
    }
}