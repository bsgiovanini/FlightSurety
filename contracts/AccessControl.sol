pragma solidity >= 0.4.24;

import "./AirlinesRole.sol";
import "./PassengerRole.sol";
contract AccessControl is AirlinesRole, PassengerRole {

}