<template>
  <v-container>
    <v-alert :value="operationalSetted$" dismissible type="success">Operating Status Updated!</v-alert>
    <v-layout row>
      <v-flex xs12>
        <v-card>
          <v-layout align-start justify-center row fill-height>
            <v-flex xs6>
              <v-card-title primary-title>
                <div>
                  <div class="headline">Operating Status</div>
                </div>
              </v-card-title>
              <v-card-text>
                <div>
                  <v-flex xs10 sm10 md10>
                    <v-switch v-model="status" label="Is Operational"></v-switch>
                  </v-flex>
                  <v-flex xs4 sm4 md4>
                    <v-btn @click="setOperatingStatus" success>Update</v-btn>
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
export default {
  subscriptions() {
    return {
      operationalSetted$: contractService.operationalSetted$,
      isOperational$: contractService.isOperational$
    };
  },
  data() {
    return {
      status: false
    };
  },
  methods: {
    setOperatingStatus() {
      contractService.setOperatingStatus(this.status);
    }
  },
  created() {
    this.$observables.isOperational$.subscribe(status => {
      this.status = status;
    });
  }
};
</script>

