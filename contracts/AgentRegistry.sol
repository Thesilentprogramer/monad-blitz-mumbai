// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal ERC-721 implementation to avoid external dependency issues if compiling standalone
contract AgentRegistry {
    struct Agent {
        address wallet;
        string metadataURI;
        uint256 reputation;
        bool isRegistered;
    }

    string public name = "SwarmGuard Agent";
    string public symbol = "SGAGENT";

    mapping(address => Agent) public agents;
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;

    uint256 private _nextTokenId;
    address public owner;

    event AgentRegistered(address indexed wallet, uint256 indexed tokenId, string metadataURI);
    event ReputationUpdated(address indexed wallet, uint256 newReputation);

    constructor() {
        owner = msg.sender;
    }

    function registerAgent(address agentWallet, string calldata metadataURI) external returns (uint256) {
        require(!agents[agentWallet].isRegistered, "Agent already registered");

        uint256 tokenId = _nextTokenId++;
        ownerOf[tokenId] = agentWallet;
        balanceOf[agentWallet]++;

        agents[agentWallet] = Agent({
            wallet: agentWallet,
            metadataURI: metadataURI,
            reputation: 100,
            isRegistered: true
        });

        emit AgentRegistered(agentWallet, tokenId, metadataURI);
        return tokenId;
    }

    function updateReputation(address agentWallet, uint256 newReputation) external {
        require(msg.sender == owner, "Only owner can update reputation");
        require(agents[agentWallet].isRegistered, "Agent not registered");
        agents[agentWallet].reputation = newReputation;
        emit ReputationUpdated(agentWallet, newReputation);
    }
}
