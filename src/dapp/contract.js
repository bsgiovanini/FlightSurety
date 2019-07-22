import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import { Subject, BehaviorSubject } from "rxjs";

class Contract {
  constructor(network) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.account = null;
    this.airlines = [];
    this.passengers = [];
    this.contractLoaded$ = new BehaviorSubject();
    this.isOperational$ = new Subject();
    this.flightStatus$ = new Subject();
    this.role$ = new BehaviorSubject();
    this.airlineRegistered$ = new Subject();
    this.flightRegistered$ = new Subject();
    this.funded$ = new Subject();
    this.airlineVoted$ = new Subject();
    this.getFlights$ = new Subject();
    this.flightStatusReturned$ = new Subject();
    this.ticketExpired$ = new Subject();
    this.ticketsOnSaleLoaded$ = new Subject();
    this.ticketBought$ = new Subject();
    this.ticketIsOnSocialSale$ = new Subject();
    this.ticketsOnSocialSaleLoaded$ = new Subject();
    this.ticketPriceBySocialTicket$ = new Subject();
    this.ticketSocialBought$ = new Subject();
    this.ticketExecuted$ = new Subject();

    if (window.ethereum) {
      // use MetaMask's provider
      this.web3 = new Web3(window.ethereum);
      window.ethereum.enable(); // get permission to access accounts
    } else {
      console.warn(
        "No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live"
      );
      // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
      this.web3 = new Web3(
        new Web3.providers.HttpProvider("http://127.0.0.1:7545")
      );
    }
    try {
      // get contract instance
      this.web3.eth.net.getId().then(networkId => {
        const deployedNetwork = FlightSuretyApp.networks[networkId];
        this.meta = new this.web3.eth.Contract(
          FlightSuretyApp.abi,
          deployedNetwork.address
        );
        this.web3.eth.getAccounts().then(accounts => {
          this.account = accounts[0];
          let counter = 1;
          while (this.airlines.length < 5) {
            this.airlines.push(accounts[counter++]);
          }
          while (this.passengers.length < 5) {
            this.passengers.push(accounts[counter++]);
          }
          this.contractLoaded$.next(true);
        });
        this.meta.events.FlightStatusInfo(
          {
            fromBlock: 0
          },
          async (error, event) => {
            if (error) {
              console.log(error);
            } else {
              this.flightStatusReturned$.next(event.returnValues);
            }
          }
        );
      });

      // get accounts
    } catch (error) {
      console.error("Could not connect to contract or chain.", error);
      this.contractLoaded$.next(false);
    }
  }

  isOperational() {
    let self = this;
    self.meta.methods
      .isOperational()
      .call({ from: self.account })
      .then(is => {
        this.isOperational$.next(is);
      });
  }

  fetchFlightStatus(flight, airline, timestamp) {
    let self = this;
    let payload = {
      airline: airline,
      flight: flight,
      timestamp: timestamp
    };
    const { fetchFlightStatus } = this.meta.methods;

    fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.account })
      .then(status => {
        this.flightStatus$.next(status);
      });
  }

  whoIsOwner() {
    const { owner } = this.meta.methods;
    owner()
      .call({ from: this.account })
      .then(is => {
        this.owner$.next(is);
      });
  }

  role() {
    const { isAirlines, isOwner } = this.meta.methods;
    Promise.all([
      isAirlines(this.account).call(),
      isOwner(this.account).call()
    ]).then(values => {
      if (values[0]) this.role$.next("airlines");
      if (values[1]) this.role$.next("admin");
      if (!values[0] && !values[1]) this.role$.next("passenger");
    });
  }

  registerAirline(address) {
    const { checkAirlineStatus, registerAirline, vote } = this.meta.methods;
    checkAirlineStatus(address)
      .call()
      .then(status => {
        if (
          status.registeredAirlines <= 4 ||
          status.votes >= status.registeredAirlines / 2
        ) {
          registerAirline(address)
            .send({
              from: this.account
            })
            .then(msg => {
              this.airlineRegistered$.next(msg);
            });
        } else {
          if (status.votes < status.registeredAirlines / 2) {
            vote(address)
              .send({
                from: this.account
              })
              .then(msg => {
                checkAirlineStatus(address)
                  .call()
                  .then(statusAfter => {
                    this.airlineVoted$.next(statusAfter);
                  });
              });
          }
        }
      });
  }

  registerFlight(flight) {
    const { registerFlight, isAirlineAllowed } = this.meta.methods;
    registerFlight(flight, new Date().getTime())
      .send({ from: this.account })
      .then(msg => {
        this.flightRegistered$.next(msg);
      });
  }

  fund(amount) {
    const amountInWei = amount * 1000000000000000000;
    const { fund } = this.meta.methods;
    fund()
      .send({ from: this.account, value: amountInWei })
      .then(msg => {
        this.funded$.next(msg);
      });
  }

  getFlights() {
    const { getFlights, getFlightByKey } = this.meta.methods;
    getFlights()
      .call()
      .then(resp => {
        const promises = [];
        resp.forEach(flightkey => {
          promises.push(getFlightByKey(flightkey).call());
        });
        Promise.all(promises).then(flights => {
          this.getFlights$.next(flights);
        });
      });
  }

  putTicketOnSale(barCode, price) {
    const { putTicketOnSale } = this.meta.methods;
    putTicketOnSale(barCode, price)
      .send({ from: this.account })
      .then(msg => {
        this.ticketIsOnSale$.next({ barCode, price });
      });
  }
}

export default new Contract("localhost");
