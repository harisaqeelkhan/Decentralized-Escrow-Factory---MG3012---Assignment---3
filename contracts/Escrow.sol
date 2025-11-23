pragma solidity ^0.5.0;

contract Escrow {

    // --- State Variables ---
    address public buyer;
    address public seller;
    address public arbiter;
    
    // --- NEW VARIABLES ---
    uint public dealAmount; // The agreed-upon price in Wei
    string public dealDescription; // The details of the job

    enum State { Created, Funded, Released, Refunded }
    State public currentState;

    // --- Constructor (UPDATED) ---
    constructor(
        address _buyer,
        address _seller,
        address _arbiter,
        uint _dealAmount,
        string memory _description
    ) public {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        dealAmount = _dealAmount; // Set the price
        dealDescription = _description; // Set the job details
        currentState = State.Created;
    }

    // --- Functions ---

    // 1. Buyer deposits funds (UPDATED)
    function deposit() public payable {
        require(msg.sender == buyer, "Only buyer can deposit");
        require(currentState == State.Created, "Deal is not in Created state");
        
        // --- THIS IS THE CRITICAL NEW CHECK ---
        // The contract now ENFORCES the correct deposit amount
        require(msg.value == dealAmount, "Must deposit the exact deal amount");
        
        currentState = State.Funded;
    }

    // 2. Release Funds (No change)
    function releaseFunds() public {
        require(msg.sender == buyer || msg.sender == arbiter, "Only buyer or arbiter can release");
        require(currentState == State.Funded, "Deal is not in Funded state");
        currentState = State.Released;
        address(uint160(seller)).transfer(address(this).balance);
    }

    // 3. Refund Funds (No change)
    function refundFunds() public {
        require(msg.sender == seller || msg.sender == arbiter, "Only seller or arbiter can refund");
        require(currentState == State.Funded, "Deal is not in Funded state");
        currentState = State.Refunded;
        address(uint160(buyer)).transfer(address(this).balance);
    }
}