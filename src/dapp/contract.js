import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import { Subject, BehaviorSubject } from "rxjs";

class Contract {
  constructor(network) {
    let config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
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
    this.organizedTicketsLoaded$ = new Subject();
    this.ticketIsOnSale$ = new Subject();
    this.ticketPriceByTicket$ = new Subject();
    this.ticketExpired$ = new Subject();
    this.ticketsOnSaleLoaded$ = new Subject();
    this.ticketBought$ = new Subject();
    this.ticketIsOnSocialSale$ = new Subject();
    this.ticketsOnSocialSaleLoaded$ = new Subject();
    this.ticketPriceBySocialTicket$ = new Subject();
    this.ticketSocialBought$ = new Subject();
    this.ticketExecuted$ = new Subject();

    debugger;

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
      });

      // get accounts
    } catch (error) {
      console.error("Could not connect to contract or chain.");
      this.contractLoaded$.next(false);
    }
  }

  isOperational() {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.account })
      .then(is => {
        debugger;
        this.isOperational$.next(is);
      });
  }

  fetchFlightStatus(flight) {
    debugger;
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000)
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.account })
      .then(status => {
        this.flightStatus$.next(status);
      });
  }

  whoIsOwner() {
    const { owner } = this.meta.methods;
    owner()
      .call()
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
    const { registerAirline } = this.meta.methods;
    registerAirline(address)
      .send({ from: this.account })
      .then(msg => {
        this.airlineRegistered$.next(msg);
      });
  }

  registerFlight(flight) {
    const { registerFlight } = this.meta.methods;
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

  generateTicket(eventName, ticketNotes) {
    const { generateTicket } = this.meta.methods;
    generateTicket(eventName, ticketNotes)
      .send({ from: this.account })
      .then(msg => {
        this.ticketGenerated$.next(msg);
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

  putTicketOnSocialSale(barCode, price) {
    const { socialPutTicketOnSale } = this.meta.methods;
    socialPutTicketOnSale(barCode, price)
      .send({ from: this.account })
      .then(msg => {
        this.ticketIsOnSocialSale$.next({ barCode, price });
      });
  }

  getPriceByTicketOnSale(barCode) {
    const { getPriceByTicketOnSale } = this.meta.methods;
    getPriceByTicketOnSale(barCode)
      .call()
      .then(price => {
        this.ticketPriceByTicket$.next({ barCode, price });
      });
  }

  getPriceByTicketOnSocialSale(barCode) {
    const { getPriceByTicketOnSocialSale } = this.meta.methods;
    getPriceByTicketOnSocialSale(barCode)
      .call()
      .then(price => {
        this.ticketPriceBySocialTicket$.next({ barCode, price });
      });
  }

  expireTicket(barCode) {
    const { expireTicket } = this.meta.methods;
    expireTicket(barCode)
      .send({ from: this.account })
      .then(msg => {
        this.ticketExpired$.next(msg);
      });
  }

  loadMyTickets() {
    const { loadTicketsByOwner, getTicketByBarCode } = this.meta.methods;
    loadTicketsByOwner(this.account)
      .call()
      .then(tickets => {
        const toReturn = [];
        const promises = [];
        tickets.forEach(ticket => {
          if (ticket > 0) promises.push(getTicketByBarCode(ticket).call());
        });
        Promise.all(promises).then(data => {
          data.forEach(tkt => {
            if (tkt[2].trim().length > 0 && tkt[4] != 3)
              toReturn.push({
                ownerID: tkt[0],
                eventOrganizerID: tkt[1],
                eventName: tkt[2],
                ticketNotes: tkt[3],
                ticketState: tkt[4],
                lastSocialMemberID: tkt[5],
                barCode: tkt[6]
              });
          });
          this.myTicketsLoaded$.next(toReturn);
        });
      });
  }

  loadTicketsOrganizedByMe() {
    const { loadTicketsByOrganizer, getTicketByBarCode } = this.meta.methods;
    loadTicketsByOrganizer(this.account)
      .call()
      .then(tickets => {
        const toReturn = [];
        const promises = [];
        tickets.forEach(ticket => {
          if (ticket > 0) promises.push(getTicketByBarCode(ticket).call());
        });
        Promise.all(promises).then(data => {
          data.forEach(tkt => {
            if (tkt[2].trim().length > 0 && tkt[4] != 3)
              toReturn.push({
                ownerID: tkt[0],
                eventOrganizerID: tkt[1],
                eventName: tkt[2],
                ticketNotes: tkt[3],
                ticketState: tkt[4],
                lastSocialMemberID: tkt[5],
                barCode: tkt[6]
              });
          });
          this.organizedTicketsLoaded$.next(toReturn);
        });
      });
  }

  loadTicketsOnSale() {
    const { loadTicketsOnSale, getTicketByBarCode } = this.meta.methods;
    loadTicketsOnSale()
      .call()
      .then(tickets => {
        const toReturn = [];
        const promises = [];
        tickets.forEach(ticket => {
          if (ticket > 0) promises.push(getTicketByBarCode(ticket).call());
        });
        Promise.all(promises).then(data => {
          data.forEach(tkt => {
            if (tkt[2].trim().length > 0)
              toReturn.push({
                ownerID: tkt[0],
                eventOrganizerID: tkt[1],
                eventName: tkt[2],
                ticketNotes: tkt[3],
                ticketState: tkt[4],
                lastSocialMemberID: tkt[5],
                barCode: tkt[6]
              });
          });
          this.ticketsOnSaleLoaded$.next(toReturn);
        });
      });
  }

  buyTicket(barCode, price) {
    const { buyTicket } = this.meta.methods;
    buyTicket(barCode)
      .send({
        from: this.account,
        value: price
      })
      .then(msg => {
        this.ticketBought$.next(msg);
      });
  }

  socialBuyTicket(barCode, price) {
    const { socialBuyTicket } = this.meta.methods;
    socialBuyTicket(barCode)
      .send({
        from: this.account,
        value: price
      })
      .then(msg => {
        this.ticketSocialBought$.next(msg);
      });
  }

  loadTicketsOnSocialSale() {
    const { loadTicketsOnSocialSale, getTicketByBarCode } = this.meta.methods;
    loadTicketsOnSocialSale()
      .call()
      .then(tickets => {
        const toReturn = [];
        const promises = [];
        tickets.forEach(ticket => {
          if (ticket > 0) promises.push(getTicketByBarCode(ticket).call());
        });
        Promise.all(promises).then(data => {
          data.forEach(tkt => {
            if (tkt[2].trim().length > 0)
              toReturn.push({
                ownerID: tkt[0],
                eventOrganizerID: tkt[1],
                eventName: tkt[2],
                ticketNotes: tkt[3],
                ticketState: tkt[4],
                lastSocialMemberID: tkt[5],
                barCode: tkt[6]
              });
          });
          this.ticketsOnSocialSaleLoaded$.next(toReturn);
        });
      });
  }

  executeTicket(barCode) {
    const { receiveTicket } = this.meta.methods;
    receiveTicket(barCode)
      .send({
        from: this.account
      })
      .then(msg => {
        this.ticketExecuted$.next(msg);
      });
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000)
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, payload);
      });
  }
}

export default new Contract("localhost");
