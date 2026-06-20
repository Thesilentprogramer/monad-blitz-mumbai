// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITargetProtocol {
    function pause() external;
    function paused() external view returns (bool);
}

contract SwarmCoordinator {
    address[] public agents;
    mapping(address => bool) public isAgent;
    mapping(address => bool) public hasVoted;
    
    uint256 public flagCount;
    uint256 public threshold;
    bool public triggered;
    
    address public targetProtocol;
    address public owner;

    event VerdictSubmitted(address indexed agent, bool isAttack, uint256 currentFlags);
    event ActionTriggered(address indexed protocol);

    constructor(address[] memory _agents, uint256 _threshold, address _targetProtocol) {
        require(_threshold <= _agents.length, "Threshold exceeds agent count");
        agents = _agents;
        for (uint256 i = 0; i < _agents.length; i++) {
            isAgent[_agents[i]] = true;
        }
        threshold = _threshold;
        targetProtocol = _targetProtocol;
        owner = msg.sender;
    }

    function submitVerdict(bool isAttack) external {
        require(isAgent[msg.sender], "Caller is not a registered agent");
        require(!hasVoted[msg.sender], "Agent has already voted");
        
        hasVoted[msg.sender] = true;
        
        if (isAttack) {
            flagCount++;
            emit VerdictSubmitted(msg.sender, true, flagCount);
            
            if (flagCount >= threshold && !triggered) {
                triggered = true;
                emit ActionTriggered(targetProtocol);
                ITargetProtocol(targetProtocol).pause();
            }
        } else {
            emit VerdictSubmitted(msg.sender, false, flagCount);
        }
    }

    function resetConsensus() external {
        require(msg.sender == owner, "Only owner can reset");
        for (uint256 i = 0; i < agents.length; i++) {
            hasVoted[agents[i]] = false;
        }
        flagCount = 0;
        triggered = false;
    }
}
