pragma solidity >=0.4.25;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./AccessControl.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp is AccessControl {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    
    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract
    FlightSuretyData dataContract;

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    mapping(address => address[]) private multiCalls;
    
 
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
         // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAirlineIsAllowed() {
        require(dataContract.isAirLineAllowed(msg.sender) == true, "Airline is not allowed yet");
        _;
    }

    modifier requirenotBeAirlines() {
        require (!isAirlines(msg.sender), "Should not be airlines");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address _dataContract, address _firstAirLine) public {
        dataContract = FlightSuretyData(_dataContract);
        contractOwner = msg.sender;
        addAirlines(_firstAirLine);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public returns(bool) {
        return dataContract.isOperational();  // Modify to call data contract's status
    }

    function setOperatingStatus(bool status) public {
        dataContract.setOperatingStatus(status, msg.sender);  // Modify to call data contract's status
    }

    function owner() public view returns(address) {
        return contractOwner;
    }

    function isOwner(address _address) public view returns (bool) {
        return _address == contractOwner;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */

    function checkAirlineStatus(address airline) public returns(uint256 registeredAirlines, uint256 votes) {
        registeredAirlines = howManyAirLinesRegistered();
        votes = multiCalls[airline].length;
        return (registeredAirlines, votes);
    }

    function registerAirline (address airline)
                            external
                            requireIsOperational
                            onlyAirlines
                            requireAirlineIsAllowed
    {
        require(!isAirlines(airline), "AIRLINE ALREADY REGISTERED");
        addAirlines(airline);
        if (multiCalls[airline].length > 0) {
            delete multiCalls[airline];
         }


    }

    function vote(address airline) external requireIsOperational onlyAirlines requireAirlineIsAllowed {
        uint votes = multiCalls[airline].length;
        bool isDuplicate = false;
        for(uint c = 0; c < votes; c++) {
            if (multiCalls[airline][c] == msg.sender) {
                isDuplicate = true;
            }
        }
        require (!isDuplicate, "Caller has already called this function");
        multiCalls[airline].push(msg.sender);
    }

    function fund () external requireIsOperational onlyAirlines payable {
        dataContract.fund.value(msg.value)(msg.sender);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight(string flight, uint256 timestamp) external requireIsOperational onlyAirlines  requireAirlineIsAllowed
    {
        dataContract.addFlight(msg.sender, flight, timestamp);
    }

    function getFlights() public returns(bytes32[]) {
        return dataContract.getFlights();
    }

    function getFlightByKey(bytes32 key) external returns(string flight, uint timestamp, address airline, bytes32 fkey) {
        return dataContract.getFlightByKey(key);
    }

    function isAirlineAllowed(address airline) public returns(bool) {
        return dataContract.isAirLineAllowed(airline);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus(address airline, string flight, uint256 timestamp, uint8 statusCode) internal {
        if (statusCode == 20) {
            dataContract.creditInsurees(airline, flight, timestamp);
        }
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
    {
        uint8 index = getRandomIndex(contractOwner);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function buy(address passenger, bytes32 key) external payable
      requireIsOperational requirenotBeAirlines {
        require(msg.value > 0 ether, "Should greater than 0 ether");
        require(msg.value <= 1 ether, "Should be less than 1 ether");
        dataContract.buy.value(msg.value)(passenger, key);
    }

    function getPassengerAmount(address passenger, bytes32 key) external  returns(uint) {
        return dataContract.getAmountPayedByPassengerAndFlight(passenger, key);
    }

    function pay(address passenger) external requireIsOperational payable  {
        require(passenger == msg.sender, "Caller is not the passenger");
        dataContract.pay(msg.sender);
    }

// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle[]) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle() external requireIsOperational payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(contractOwner);

        oracles[contractOwner].push(Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    }));
    }

    function getMyIndexes(uint i) external view returns(uint8[3])
    {
        require(oracles[contractOwner][i].isRegistered, "Not registered as an oracle");

        return oracles[contractOwner][i].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        bool indexAvailable = false;
        for(uint i = 0; i < oracles[contractOwner].length; i++) {
            indexAvailable = indexAvailable ||
               ((oracles[contractOwner][i].indexes[0] == index) || (oracles[contractOwner][i].indexes[1] == index) || (oracles[contractOwner][i].indexes[2] == index));
        }
        require(indexAvailable == true, "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Response already sent for this flight");

        oracleResponses[key].responses[statusCode].push(contractOwner);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);

            oracleResponses[key].isOpen = false;
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        internal pure returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes (address account)
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }
        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }
        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8)
    {
        uint8 maxValue = 10;
        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}

contract FlightSuretyData {
    function isOperational() external returns(bool);

    function fund(address airline) external payable;

    function addFlight(address airline, string flight, uint timestamp) external;

    function getFlights() external returns(bytes32[]);

    function getFlightByKey(bytes32 key) external returns(string flight, uint timestamp, address airline, bytes32 fkey);

    function creditInsurees(address airline, string flight, uint256 timestamp) external;

    function isAirLineAllowed (address airline) public returns (bool);

    function buy(address passenger, bytes32 flightkey) external payable;

    function getAmountPayedByPassengerAndFlight(address passenger, bytes32 flightkey) external pure returns (uint);

    function pay(address passenger) external payable;

    function setOperatingStatus (bool mode, address sender) external;
}