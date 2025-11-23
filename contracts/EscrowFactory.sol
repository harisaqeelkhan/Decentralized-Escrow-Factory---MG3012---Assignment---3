pragma solidity ^0.5.0;

import "./Escrow.sol";

contract EscrowFactory {

    address[] public allEscrows;
    
    event EscrowCreated(
        address newEscrowAddress, 
        address indexed buyer, 
        address indexed seller, 
        uint dealAmount
    );

    // --- THIS FUNCTION IS UPDATED ---
    function createEscrow(
        address _buyer, // <-- THIS IS THE NEW ARGUMENT
        address _seller,
        address _arbiter,
        uint _dealAmount, // in Wei
        string memory _description
    ) public {
        
        // Pass the new _buyer argument to the Escrow's constructor
        Escrow newEscrow = new Escrow(
            _buyer, // <-- CHANGED FROM msg.sender
            _seller, 
            _arbiter, 
            _dealAmount, 
            _description
        );
        
        allEscrows.push(address(newEscrow));
        
        // Emit the event (this already included the buyer, so it's fine)
        emit EscrowCreated(address(newEscrow), _buyer, _seller, _dealAmount);
    }
    
    function getAllEscrows() public view returns (address[] memory) {
        return allEscrows;
    }
}