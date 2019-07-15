const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs");

module.exports = function(deployer) {
  let firstAirline = "0x45aC6a78f4c66690Cfcd85C71B117d39F46054ae";
  deployer.deploy(FlightSuretyData).then(() => {
    return deployer
      .deploy(FlightSuretyApp, FlightSuretyData.address, firstAirline)
      .then(() => {
        let config = {
          localhost: {
            url: "http://localhost:7545",
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address
          }
        };
        fs.writeFileSync(
          __dirname + "/../src/dapp/config.json",
          JSON.stringify(config, null, "\t"),
          "utf-8"
        );
        fs.writeFileSync(
          __dirname + "/../src/server/config.json",
          JSON.stringify(config, null, "\t"),
          "utf-8"
        );
      });
  });
};
