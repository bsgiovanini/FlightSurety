import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";

const STATUS_CODES = [0, 10, 20, 30, 40, 50];

const NUM_ORACLES = 10;

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

deal();

const app = express();
app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!"
  });
});

async function deal() {
  const accounts = await web3.eth.getAccounts();
  web3.eth.defaultAccount = accounts[0];

  let flightSuretyApp = new web3.eth.Contract(
    FlightSuretyApp.abi,
    config.appAddress
  );

  const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

  for (let i = 0; i < NUM_ORACLES; i++) {
    await flightSuretyApp.methods
      .registerOracle()
      .send({ value: fee, from: web3.eth.defaultAccount, gas: 3000000 });
  }

  flightSuretyApp.events.OracleRequest(
    {
      fromBlock: 0
    },
    async (error, event) => {
      if (error) {
        console.log(error);
      } else {
        console.log("event: ", event.returnValues.index);

        for (let i = 0; i < NUM_ORACLES; i++) {
          let indexes = await flightSuretyApp.methods.getMyIndexes(i).call();
          console.log(indexes);
          if (indexes.indexOf(event.returnValues.index) >= 0) {
            const pos = getRndInteger(0, STATUS_CODES.length - 1);
            await flightSuretyApp.methods
              .submitOracleResponse(
                event.returnValues.index,
                event.returnValues.airline,
                event.returnValues.flight,
                event.returnValues.timestamp,
                STATUS_CODES[pos]
              )
              .send({ from: web3.eth.defaultAccount, gas: 5000000 });
          }
        }
      }
    }
  );
}

export default app;
