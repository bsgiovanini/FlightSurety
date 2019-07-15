pragma solidity >= 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/access/rbac/Roles.sol";


contract PassengerRole  {
     using Roles for Roles.Role;

     Roles.Role private passengers;

     modifier onlyPassengers() {
       require(passengers.has(msg.sender), "DOES_NOT_HAVE_EXECUTOR_ROLE");
        _;
    }

    // Define a function 'isConsumer' to check this role
    function isPassengers(address account) public view returns (bool) {
        return passengers.has(account);
    }

    // Define a function 'addPassengers' that adds this role
    function addPassengers(address account) public {
        _addPassengers(account);
    }

    // Define a function 'renouncePassengers' to renounce this role
    function renouncePassengers() public  onlyPassengers {
        _removePassengers(msg.sender);
    }

    // Define an internal function '_addPassengers' to add this role, called by 'addPassengers'
    function _addPassengers(address account) internal {
        Roles.add(passengers, account);
    }

    // Define an internal function '_removePassengers' to remove this role, called by 'removePassengers'
    function _removePassengers(address account) internal {
        Roles.remove(passengers, account);
    }

}