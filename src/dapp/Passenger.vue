<template>
  <v-container fill-height>
    <v-data-table :headers="headers" :items="flights" class="elevation-1">
      <template v-slot:items="props">
        <td class="text-xs-right">{{ props.item.flight }}</td>
        <td class="text-xs-right">{{ props.item.airline }}</td>
        <td class="text-xs-right">{{ props.item.timestamp }}</td>
        <td class="text-xs-right">{{ props.item.status }}</td>

        <td class="text-xs-right">
          <v-btn color="green darken-1" flat title="Buy ensurance!" @click="buy(props.item.key)">Buy</v-btn>
        </td>
      </template>
    </v-data-table>
    <v-layout row>
      <v-flex xs12>
        <v-btn color="red darken-1" flat title="refresh status!" @click="refresh">Refresh Status</v-btn>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import contractService from "./contract";
import { setInterval } from "timers";
export default {
  subscriptions() {
    return {
      getFlights$: contractService.getFlights$,
      flightStatus$: contractService.flightStatus$,
      contractLoaded$: contractService.contractLoaded$,
      flightStatusReturned$: contractService.flightStatusReturned$
    };
  },
  data() {
    return {
      headers: [
        {
          text: "Flight Number",
          value: "flight"
        },
        { text: "Airline", value: "airline" },
        { text: "Timestamp", value: "timestamp" },
        { text: "Status", value: "status" }
      ],
      flights: [],
      flightNumber: ""
    };
  },
  methods: {
    submitOracle(flight, airline, timestamp) {
      contractService.fetchFlightStatus(flight, airline, timestamp);
    },
    getFlights() {
      contractService.getFlights();
    },
    buy(key) {},
    refresh() {
      this.flights.forEach(f => {
        this.submitOracle(f.flight, f.airline, f.timestamp);
      });
    }
  },
  created() {
    this.$observables.contractLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.getFlights();
      }
    });
    this.$observables.getFlights$.subscribe(flights => {
      this.flights = flights;
      this.$observables.flightStatusReturned$.subscribe(flightStatus => {
        let flightIndex = this.flights.findIndex((element, index, array) => {
          return (
            element.flight == flightStatus.flight &&
            element.timestamp == flightStatus.timestamp &&
            element.airline == flightStatus.airline
          );
        });
        let flight = this.flights[flightIndex];
        flight.status = flightStatus.status;
        this.$set(this.flights, flightIndex, flight);
      });
    });
  }
};
</script>
