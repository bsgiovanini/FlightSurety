<template>
  <v-container>
    <Loading :loading="wait" />
    <v-alert :value="airlineRegistered$" dismissible type="success">Airline successfully registered</v-alert>
    <v-alert
      :value="airlineVoted$"
      dismissible
      type="success"
    >Airline voted: vote {{airlineVoted$? airlineVoted$.votes: ""}} in {{airlineVoted$? airlineVoted$.registeredAirlines: ""}} airlines</v-alert>
    <v-alert :value="flightRegistered$" dismissible type="success">Flight successfully registered</v-alert>
    <v-alert :value="funded$" dismissible type="success">Amount successfully funded</v-alert>
    <v-layout row>
      <v-flex xs12>
        <v-card>
          <v-layout align-start justify-center row fill-height>
            <v-flex xs6>
              <v-card-title primary-title>
                <div>
                  <div class="headline">Airline Registering</div>
                </div>
              </v-card-title>
              <v-card-text>
                <div>
                  <v-flex xs10 sm10 md10>
                    <v-text-field v-model="address" label="Enter Airline Address"></v-text-field>
                  </v-flex>
                  <v-flex xs4 sm4 md4>
                    <v-btn @click="registerAirline" success>Register</v-btn>
                  </v-flex>
                </div>
              </v-card-text>
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex xs12>
        <v-card>
          <v-layout align-start justify-center row fill-height>
            <v-flex xs6>
              <v-card-title primary-title>
                <div>
                  <div class="headline">Contract Funding</div>
                </div>
              </v-card-title>
              <v-card-text>
                <div>
                  <v-flex xs10 sm10 md10>
                    <v-text-field v-model="amount" label="Enter amount in Ether"></v-text-field>
                  </v-flex>
                  <v-flex xs4 sm4 md4>
                    <v-btn :disabled="!amount || isNaN(amount)" @click="fund" success>Fund</v-btn>
                  </v-flex>
                </div>
              </v-card-text>
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
    <v-layout row>
      <v-flex xs12>
        <v-card>
          <v-layout align-start justify-center row fill-height>
            <v-flex xs6>
              <v-card-title primary-title>
                <div>
                  <div class="headline">Flight Registering</div>
                </div>
              </v-card-title>
              <v-card-text>
                <div>
                  <v-flex xs10 sm10 md10>
                    <v-text-field v-model="flight" label="Enter Flight Number"></v-text-field>
                  </v-flex>
                  <v-flex xs4 sm4 md4>
                    <v-btn :disabled="!isAirlineAllowed$" @click="registerFlight" success>Register</v-btn>
                  </v-flex>
                </div>
              </v-card-text>
            </v-flex>
          </v-layout>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import contractService from "./contract";
import Loading from "./Loading.vue";
export default {
  components: {
    Loading
  },
  subscriptions() {
    return {
      contractLoaded$: contractService.contractLoaded$,
      airlineRegistered$: contractService.airlineRegistered$,
      airlineVoted$: contractService.airlineVoted$,
      flightRegistered$: contractService.flightRegistered$,
      funded$: contractService.funded$,
      isAirlineAllowed$: contractService.isAirlineAllowed$,
      error$: contractService.error$
    };
  },
  data() {
    return {
      wait: false,
      address: null,
      flight: null,
      amount: null
    };
  },
  methods: {
    registerAirline() {
      contractService.registerAirline(this.address);
      this.wait = true;
    },
    registerFlight() {
      contractService.registerFlight(this.flight);
      this.wait = true;
    },
    fund() {
      contractService.fund(this.amount);
      this.wait = true;
    },
    checkAirlineAllowed() {
      contractService.isAirlineAllowed();
    }
  },
  created() {
    this.$observables.contractLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.checkAirlineAllowed();
      }
    });

    this.$observables.airlineRegistered$.subscribe(msg => {
      this.wait = false;
    });
    this.$observables.airlineVoted$.subscribe(msg => {
      this.wait = false;
    });
    this.$observables.flightRegistered$.subscribe(msg => {
      this.wait = false;
    });
    this.$observables.funded$.subscribe(msg => {
      this.wait = false;
    });
    this.$observables.error$.subscribe(msg => {
      this.wait = false;
    });
  }
};
</script>