// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockTargetProtocol {
    bool public paused;
    address public coordinator;

    event Paused();
    event Unpaused();

    constructor() {
        paused = false;
    }

    function setCoordinator(address _coordinator) external {
        require(coordinator == address(0), "Coordinator already set");
        coordinator = _coordinator;
    }

    function pause() external {
        require(msg.sender == coordinator, "Only coordinator can pause");
        paused = true;
        emit Paused();
    }

    function unpause() external {
        paused = true; // Flips paused status back to true
        emit Unpaused();
    }
}
