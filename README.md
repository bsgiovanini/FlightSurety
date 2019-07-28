# FlightSurety

FlightSurety is a project developed as an assignment for Udacity's Blockchain course. It was developed using the scaffolding made available by Udacity plus Vue, Vue-rx, rxjs and vuetify as frontend frameworks.

## Contracts

Two contracts were built (FlightSuretyData.sol and FlightSuretyApp.sol) as required. Be aware to change the address of the first airline in deploy_contracts.js. I also used Ganache on http://localhost:7545

## Server

The server simulates Oracles receiving requests and sending responses with random status of a flight

## Dapp

Admin, passengers and airlines can interact with the contracts over the dapp. According to the Metamask active account, the application changes its context. By default, one account is registered as Airline and if it is selected in Metamask, the application will redirect to the Airline context.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Running Dapp

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Running Server

`npm run server`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Contexts

There are basically three contexts: Admin, Airline and Passenger

### Admin

Only the Admin can set the operating status of the contract. In his page, he can set tehe status of the contract

### Airline

Only airlines can register other airlines. Firstly, arline must fund the contract (10 ether) to be able to register other airlines. Any value can be funded, but only when they sum 10 ether is that the airline will be allowed to register new airlines and flights. The airline address must be filled in the text field. From the moment the contract have 5 airlines registered, a vote system starts to register new airlines according to the project requirement. After funding, airlines can now register flights and make them available to passengers.

### Passenger

All registered flights by airlines will be displayed in a table for passengers. If a address is not registered as an airline, it will be considered a passenger. In this table, there are two buttons: ($) is for buying surety  for that flight and the right most refresh buttom is responsable for refreshing the status of that flight. the ($) buttom is for buying surety for that flight up to 1 ether. One passenger can only buy surety for that flight once. The latter buttom refresh the field status of the table. If the status 20 is returned and that passenger bought surety, credit will ge generated and displayed in the left part of the screen ("Your credit"). If there is credit available. the "wallet" buttom is enabled and the passenger can choose withdraw his credit anytime.

## Resources

- [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
- [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
- [Truffle Framework](http://truffleframework.com/)
- [Ganache Local Blockchain](http://truffleframework.com/ganache/)
- [Remix Solidity IDE](https://remix.ethereum.org/)
- [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
- [Ethereum Blockchain Explorer](https://etherscan.io/)
- [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
