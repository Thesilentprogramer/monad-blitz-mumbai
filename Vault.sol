// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Minimal interface to interact with your FakeToken
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Vault {
    IERC20 public token;
    address public owner;
    address public coordinator;
    bool public isFrozen;

    // Track user balances inside the vault
    mapping(address => uint256) public balances;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event VaultFrozen();
    event VaultUnfrozen();

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier onlyCoordinator() {
        require(msg.sender == coordinator, "Not the authorized coordinator");
        _;
    }

    modifier whenNotFrozen() {
        require(!isFrozen, "Vault is frozen due to security alert!");
        _;
    }

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
        owner = msg.sender;
        isFrozen = false;
    }

    // 1. THIS IS THE CRITICAL LINE FOR STEP E
    // Allows you to link the Coordinator to this Vault after deployment
    function setCoordinator(address _coordinator) external onlyOwner {
        require(_coordinator != address(0), "Invalid address");
        coordinator = _coordinator;
    }

    // 2. THIS IS THE LINE THE COORDINATOR CALLS
    // When 3 out of 4 agents vote "danger", the coordinator calls this to lock everything down
    function freezeVault() external onlyCoordinator {
        isFrozen = true;
        emit VaultFrozen();
    }

    // Allows the owner to manually unfreeze it once the danger passes
    function unfreezeVault() external onlyOwner {
        isFrozen = false;
        emit VaultUnfrozen();
    }

    // Standard deposit function (blocked if frozen)
    function deposit(uint256 _amount) external whenNotFrozen {
        require(_amount > 0, "Amount must be greater than 0");
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        
        balances[msg.sender] += _amount;
        emit Deposited(msg.sender, _amount);
    }

    // Standard withdraw function (blocked if frozen)
    function withdraw(uint256 _amount) external whenNotFrozen {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        balances[msg.sender] -= _amount;
        
        require(token.transfer(msg.sender, _amount), "Transfer failed");
        emit Withdrawn(msg.sender, _amount);
    }
}