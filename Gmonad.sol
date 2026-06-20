// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Gmonad { 
    string public greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function setGreeting(string calldata _greeting) external {
        greeting = _greeting;
    }
}