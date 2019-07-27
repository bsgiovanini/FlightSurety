import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
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
    this.operationalSetted$ = new Subject();
    this.flightStatus$ = new Subject();
    this.role$ = new BehaviorSubject();
    this.airlineRegistered$ = new Subject();
    this.flightRegistered$ = new Subject();
    this.funded$ = new Subject();
    this.airlineVoted$ = new Subject();
    this.getFlights$ = new Subject();
    this.flightStatusReturned$ = new Subject();
    this.ensuranceBought$ = new Subject();
    this.amountReturned$ = new Subject();
    this.credit$ = new BehaviorSubject();
    this.payed$ = new Subject();
    this.isAirlineAllowed$ = new Subject();
    this.error$ = new Subject();

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
      this.web3.eth.net.getId().then(networkId => {
        const deployedNetwork = FlightSuretyData.networks[networkId];
        this.metad = new this.web3.eth.Contract(
          FlightSuretyData.abi,
          deployedNetwork.address
        );

        this.metad.events.CreditIssuedForPassenger(
          {
            fromBlock: 0
          },
          async (error, event) => {
            if (error) {
              console.log(error);
            } else {
              if (this.account == event.returnValues.passenger) {
                this.credit$.next(
                  event.returnValues.credit / 1000000000000000000
                );
              }
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

  setOperatingStatus(status) {
    const { setOperatingStatus } = this.meta.methods;
    setOperatingStatus(status)
      .send({ from: this.account })
      .then(msg => {
        this.operationalSetted$.next(true);
        this.isOperational();
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
            })
            .catch(error => {
              this.error$.next(error);
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
                    if (
                      statusAfter.votes >=
                      statusAfter.registeredAirlines / 2
                    ) {
                      registerAirline(address)
                        .send({
                          from: this.account
                        })
                        .then(msg => {
                          this.airlineRegistered$.next(msg);
                        })
                        .catch(error => {
                          this.error$.next(error);
                        });
                    } else {
                      this.airlineVoted$.next(statusAfter);
                    }
                  });
              })
              .catch(error => {
                this.error$.next(error);
              });
          }
        }
      })
      .catch(error => {
        this.error$.next(error);
      });
  }

  registerFlight(flight) {
    const { registerFlight } = this.meta.methods;
    registerFlight(flight, new Date().getTime())
      .send({ from: this.account })
      .then(msg => {
        this.flightRegistered$.next(msg);
      })
      .catch(error => {
        this.error$.next(error);
      });
  }

  isAirlineAllowed() {
    const { isAirlineAllowed } = this.meta.methods;
    isAirlineAllowed(this.account)
      .call()
      .then(is => {
        this.isAirlineAllowed$.next(is);
      })
      .catch(error => {
        this.error$.next(error);
      });
  }

  fund(amount) {
    const amountInWei = amount * 1000000000000000000;
    const { fund } = this.meta.methods;
    fund()
      .send({ from: this.account, value: amountInWei })
      .then(msg => {
        this.funded$.next(msg);
        this.isAirlineAllowed();
      })
      .catch(error => {
        this.error$.next(error);
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
        Promise.all(promises)
          .then(flights => {
            this.getFlights$.next(flights);
          })
          .catch(error => {
            this.error$.next(error);
          });
      })
      .catch(error => {
        this.error$.next(error);
      });
  }

  buy(fkey, amount) {
    const { buy } = this.meta.methods;
    const amountInWei = amount * 1000000000000000000;
    buy(this.account, fkey)
      .send({ from: this.account, value: amountInWei })
      .then(msg => {
        this.ensuranceBought$.next({ passenger: this.account, fkey });
      })
      .catch(error => {
        this.error$.next(error);
      });
  }

  getPassengerAmount(fkey) {
    const { getPassengerAmount } = this.meta.methods;
    getPassengerAmount(this.account, fkey)
      .call()
      .then(amount => {
        this.amountReturned$.next({
          value: amount / 1000000000000000000,
          fkey
        });
      })
      .catch(error => {
        this.error$.next(error);
      });
  }

  withdraw() {
    const { pay } = this.meta.methods;
    pay(this.account)
      .send({ from: this.account })
      .then(msg => {
        this.payed$.next(this.account);
      })
      .catch(error => {
        this.error$.next(error);
      });
  }
}

export default new Contract("localhost");
