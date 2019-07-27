<template>
  <v-app>
    <v-navigation-drawer app>
      <v-toolbar flat>
        <v-list>
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title class="title">Flight Surely</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list>
      </v-toolbar>

      <v-divider></v-divider>
      <v-list dense class="pt-0">
        <v-list-tile :to="role.link">
          <v-list-tile-action>
            <v-icon>{{role.icon}}</v-icon>
          </v-list-tile-action>

          <v-list-tile-content>
            <v-list-tile-title>{{role.title}}</v-list-tile-title>
            <v-list-tile-sub-title>
              Operating Status:
              <v-icon color="green" v-if="isOperational$">thumb_up</v-icon>
              <v-icon color="red" v-if="!isOperational$">thumb_down</v-icon>
            </v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
      <v-divider></v-divider>
      <v-list dense class="pt-0" v-if="role.title=='Passenger'">
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title>Your Credit</v-list-tile-title>
            <v-list-tile-sub-title>Amount: {{credit$ || 0}} Ether</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-btn
              :disabled="credit$ == null || credit$ <= 0"
              flat
              icon
              color="green"
              title="Withdraw your credit!"
              @click="withdraw"
            >
              <v-icon>account_balance_wallet</v-icon>
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <v-container fluid>
        <v-alert :value="error$" dismissible type="error">An error ocurred</v-alert>
        <router-view></router-view>
      </v-container>
    </v-content>
  </v-app>
</template>


<script>
import contractService from "./contract";
export default {
  subscriptions() {
    return {
      contractLoaded$: contractService.contractLoaded$,
      isOperational$: contractService.isOperational$,
      role$: contractService.role$,
      credit$: contractService.credit$,
      error$: contractService.error$
    };
  },
  data() {
    return {
      right: true,
      role: { link: "/passenger", icon: "home", title: "Loading..." },
      roles: {
        airlines: { link: "/airlines", icon: "home", title: "Airlines" },
        passenger: { link: "/passenger", icon: "home", title: "Passenger" },
        admin: { link: "/admin", icon: "home", title: "Admin" }
      }
    };
  },
  methods: {
    isOperational() {
      contractService.isOperational();
    },
    checkRole() {
      contractService.role();
    },
    withdraw() {
      contractService.withdraw();
    }
  },
  created() {
    this.$observables.contractLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.isOperational();
        this.checkRole();
      }
    });
    this.$observables.role$.subscribe(role => {
      if (role) {
        this.role = this.roles[role];
        this.$router.push(this.role.link);
      }
    });
  }
};
</script>

<style>
</style>
