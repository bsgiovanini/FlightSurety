pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    mapping(address => bool) airLinesFunded;

    mapping(address => uint256) creditByPassenger;

    mapping(address => mapping(bytes32 => uint256)) amountPayedByPassengerAndFlight;

    mapping(bytes32 => address[]) passengersWhoBoughtFlight;

    bytes32[] public flights;

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    modifier requireUpto1ether() {
        require(msg.value > 0 && msg.value <= 100000000000000000, "Should be up to 1 ether");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireFundedEnough() {
        require (msg.value >= 10000000000000000000, "Caller did not fund enough");
        _;
    }

    modifier requireIsAirLineAllowed() {
        require(isAirLineAllowed(msg.sender) == true, "Airline is not allowed");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational() external returns(bool)
    {
        return operational;
    }



    function addFlight(bytes32 flightkey) external requireIsOperational requireIsAirLineAllowed()  {
        flights.push(flightkey);
    }

    function getFlights() public returns(bytes32[]){
        return flights;
    }
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus (bool mode) external requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy(address passenger, address airline, string flight, uint256 timestamp) external requireUpto1ether payable
    {
        bytes32 flightkey = getFlightKey(airline, flight, timestamp);
        amountPayedByPassengerAndFlight[passenger][flightkey] = msg.value;
        passengersWhoBoughtFlight[flightkey].push(passenger);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(address airline, string flight, uint256 timestamp) external
    {
        bytes32 flightkey = getFlightKey(airline, flight, timestamp);
        for (uint i = 0; i < passengersWhoBoughtFlight[flightkey].length; i ++) {
            address passenger = passengersWhoBoughtFlight[flightkey][i];
            creditByPassenger[passenger] = amountPayedByPassengerAndFlight[passenger][flightkey].add(
                amountPayedByPassengerAndFlight[passenger][flightkey].div(2));
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address passenger) external
    {
        passenger.transfer(creditByPassenger[passenger]);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund() external requireFundedEnough payable {
        airLinesFunded[msg.sender] = true;
    }

    function isAirLineAllowed (address airline) public returns (bool)  {
        return airLinesFunded[airline] == true;
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    


}

