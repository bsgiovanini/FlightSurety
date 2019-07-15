pragma solidity >= 0.4.24;

import "../node_modules/openzeppelin-solidity/contracts/access/rbac/Roles.sol";
import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract AirlinesRole  {
     using Roles for Roles.Role;
     using SafeMath for uint256;

     Roles.Role private airlines;

     uint count = 0;

     modifier onlyAirlines() {
       require(airlines.has(msg.sender), "IS NOT AN AIRLINE REGISTERED");
        _;
    }

    // Define a function 'isConsumer' to check this role
    function isAirlines(address account) public view returns (bool) {
        return airlines.has(account);
    }

    // Define a function 'addAirlines' that adds this role
    function addAirlines(address account) public {
        _addAirlines(account);
        count.add(1);
    }

    // Define a function 'renounceAirlines' to renounce this role
    function renounceAirlines() public  onlyAirlines {
        _removeAirlines(msg.sender);
        count.sub(1);
    }

    // Define an internal function '_addAirlines' to add this role, called by 'addAirlines'
    function _addAirlines(address account) internal {
        Roles.add(airlines, account);
    }

    // Define an internal function '_removeAirlines' to remove this role, called by 'removeAirlines'
    function _removeAirlines(address account) internal {
        Roles.remove(airlines, account);
    }

    function howManyAirLinesRegistered() public view returns (uint) {
        return count;
    }

}