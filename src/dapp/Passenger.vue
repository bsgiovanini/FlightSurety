<template>
  <v-img dark src="./resources/flight.jpg">
    <v-container fill-height>
      <v-layout align-center justify-space-around row fill-height>
        <v-text-field v-model="flightNumber" outline clearable label="Flight Number" type="text" />
        <v-btn @click="submitOracle" large color="info">Submit to Oracles</v-btn>
      </v-layout>
    </v-container>
  </v-img>
</template>
<script>
import contractService from "./contract";
export default {
  subscriptions() {
    return {
      flightStatus$: contractService.flightStatus$
    };
  },
  data() {
    return {
      flightNumber: ""
    };
  },
  methods: {
    submitOracle() {
      debugger;
      contractService.fetchFlightStatus(this.flightNumber);
    }
  }
};
</script>
