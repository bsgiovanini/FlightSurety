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
    mapping(address => uint256) airLinesFunded;

    mapping(address => uint256) creditByPassenger;

    mapping(address => mapping(bytes32 => uint256)) amountPayedByPassengerAndFlight;

    mapping(bytes32 => address[]) passengersWhoBoughtFlight;

    bytes32[] flights;

    mapping(bytes32 => Flight) flightByKey;


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public {
        contractOwner = msg.sender;
    }

    struct Flight {
        string name;
        uint timestamp;
        address airline;
        bytes32 key;
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
        require(msg.value > 0 && msg.value <= 1 ether, "Should be up to 1 ether");
        _;
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner(address sender)
    {
        require(sender == contractOwner, "Caller is not contract owner");
        _;
    }

    event CreditIssuedForPassenger(address passenger, uint256 credit);

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



    function addFlight(address airline, string flight, uint timestamp) external requireIsOperational  {

        require(isAirLineAllowed(airline), "Airline not allowed");
        bytes32 flightkey = getFlightKey(airline, flight, timestamp);
        Flight memory f = Flight(flight, timestamp, airline, flightkey);
        flights.push(flightkey);
        flightByKey[flightkey] = f;
    }

    function getFlights() public returns(bytes32[]){
        return flights;
    }

    function getFlightByKey(bytes32 key) external returns(string flight, uint timestamp, address airline, bytes32 fkey) {

        Flight memory f = flightByKey[key];
        flight = f.name;
        timestamp = f.timestamp;
        airline = f.airline;
        fkey = f.key;
        return (flight, timestamp, airline, fkey);
    }
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus (bool mode, address sender) external requireContractOwner(sender)
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
    function buy(address passenger, bytes32 flightkey) external requireIsOperational requireUpto1ether  payable
    {
        amountPayedByPassengerAndFlight[passenger][flightkey] = msg.value;
        passengersWhoBoughtFlight[flightkey].push(passenger);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(address airline, string flight, uint256 timestamp) external requireIsOperational
    {
        bytes32 flightkey = getFlightKey(airline, flight, timestamp);

        uint numberOfPassengers = passengersWhoBoughtFlight[flightkey].length;
        for (uint i = 0; i < numberOfPassengers; i ++) {
            address passenger = passengersWhoBoughtFlight[flightkey][i];
            uint256 credit = amountPayedByPassengerAndFlight[passenger][flightkey].add(
                amountPayedByPassengerAndFlight[passenger][flightkey].div(2));
            creditByPassenger[passenger] = credit;
            amountPayedByPassengerAndFlight[passenger][flightkey] = 0;
            emit CreditIssuedForPassenger(passenger, credit);
        }

        for (i = 0; i < numberOfPassengers; i ++) {
            delete passengersWhoBoughtFlight[flightkey][i];
        }

    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address passenger) external requireIsOperational payable
    {
        require(creditByPassenger[passenger] > 0, "Passenger has not credit");
        uint credit = creditByPassenger[passenger];
        creditByPassenger[passenger] = 0;
        passenger.transfer(credit);
        emit CreditIssuedForPassenger(passenger, creditByPassenger[passenger]);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund(address airline) external requireIsOperational payable {
        airLinesFunded[airline] += msg.value;
    }

    function isAirLineAllowed (address airline) public returns (bool)  {
        return airLinesFunded[airline] >= 10000000000000000000;
    }

    function getFlightKey(address airline, string memory flight, uint256 timestamp) internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function getAmountPayedByPassengerAndFlight(address passenger, bytes32 flightkey) external view returns(uint) {
        return amountPayedByPassengerAndFlight[passenger][flightkey];
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */

}

