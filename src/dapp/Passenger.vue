<template>
  <v-container>
    <Loading :loading="wait" />
    <v-alert :value="payed$" dismissible type="success">Withdrawn confirmed!</v-alert>
    <v-layout row>
      <v-flex xs12>
        <v-data-table :headers="headers" :items="flights" class="elevation-1">
          <template v-slot:items="props">
            <td class="text-xs-right">{{ props.item.flight }}</td>
            <td class="text-xs-right">{{ props.item.airline }}</td>
            <td class="text-xs-right">{{ props.item.timestamp }}</td>
            <td class="text-xs-right">{{ props.item.amount }} Ether</td>
            <td class="text-xs-right">{{ getStatusByCode(props.item.status) }}</td>

            <td class="text-xs-right">
              <v-dialog v-model="dialog" persistent max-width="290">
                <template v-slot:activator="{ on }">
                  <v-btn
                    :disabled="props.item.amount > 0"
                    flat
                    icon
                    color="green"
                    title="Buy ensurance!"
                    v-on="on"
                  >
                    <v-icon>attach_money</v-icon>
                  </v-btn>
                </template>
                <v-card>
                  <v-card-title class="headline">Buy ensurance?</v-card-title>
                  <v-card-text>
                    <v-text-field label="Amount" v-model="amount"></v-text-field>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="red darken-1" flat @click="dialog = false">Cancel</v-btn>
                    <v-btn
                      color="green darken-1"
                      flat
                      :disabled="!amount || isNaN(amount) || amount <= 0 || amount > 1"
                      @click="buy(props.item.fkey); dialog = false;"
                    >Confirm</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </td>
            <td>
              <v-btn
                color="red darken-1"
                flat
                icon
                title="Refresh flight status!"
                @click="refresh(props.item)"
              >
                <v-icon>autorenew</v-icon>
              </v-btn>
            </td>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import contractService from "./contract";
import contract from "./contract";
import Loading from "./Loading.vue";
export default {
  components: {
    Loading
  },
  subscriptions() {
    return {
      getFlights$: contractService.getFlights$,
      flightStatus$: contractService.flightStatus$,
      contractLoaded$: contractService.contractLoaded$,
      flightStatusReturned$: contractService.flightStatusReturned$,
      amountReturned$: contractService.amountReturned$,
      ensuranceBought$: contractService.ensuranceBought$,
      payed$: contractService.payed$
    };
  },
  data() {
    return {
      wait: false,
      amount: 1,
      dialog: false,
      currency_config: {
        prefix: "Ether ",
        precision: 6,
        min: Number.MIN_VALUE,
        max: 1,
        allowBlank: true
      },
      headers: [
        {
          text: "Flight",
          value: "flight"
        },
        { text: "Airline", value: "airline" },
        { text: "Timestamp", value: "timestamp" },
        { text: "Payed", value: "amount" },
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
    buy(fkey) {
      contractService.buy(fkey, this.amount);
    },
    getAmount(key) {
      contractService.getPassengerAmount(key);
    },
    refresh(f) {
      this.submitOracle(f.flight, f.airline, f.timestamp);
    },
    getStatusByCode(code) {
      switch (code) {
        case 10:
          return "On Time";
        case 20:
          return "Late Airline";
        case 30:
          return "Late Weather";
        case 40:
          return "Late Technical";
        case 50:
          return "Late Other";
        default:
          return "Unknown";
      }
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
      this.flights.forEach(flight => {
        this.getAmount(flight.fkey);
      });
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
      this.$observables.amountReturned$.subscribe(amount => {
        let flightIndex = this.flights.findIndex((element, index, array) => {
          return element.fkey == amount.fkey;
        });
        let flight = this.flights[flightIndex];
        flight.amount = amount.value || 0;
        this.$set(this.flights, flightIndex, flight);
      });
      this.$observables.ensuranceBought$.subscribe(flight => {
        this.getAmount(flight.fkey);
      });
      this.$observables.payed$.subscribe(() => {
        this.flights.forEach(flight => {
          this.getAmount(flight.fkey);
        });
      });
    });
  }
};
</script>
