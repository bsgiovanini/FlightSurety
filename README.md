# FlightSurety

FlightSurety is a project developed as an assignment for Udacity's Blockchain course. It was developed using the scaffolding made available by Udacity plus Vue, Vue-rx, rxjs and vuetify as frontend frameworks.

## Contracts

Two contracts were built (FlightSuretyData.sol and FlightSuretyApp.sol) as required.

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

## Roles

There are basically three roles: Admin, Airline and Passenger

### Admin

Only the Admin can set the operating status of the contract.

## Resources

- [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
- [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
- [Truffle Framework](http://truffleframework.com/)
- [Ganache Local Blockchain](http://truffleframework.com/ganache/)
- [Remix Solidity IDE](https://remix.ethereum.org/)
- [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
- [Ethereum Blockchain Explorer](https://etherscan.io/)
- [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
