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
            <v-list-tile-sub-title>isOperational: {{isOperational$}}</v-list-tile-sub-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-content>
      <v-container fluid>
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
      role$: contractService.role$
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
        /*eventOrganizer: {
          link: "/eventOrganizer",
          icon: "home",
          title: "Organizer"
        },
        eventExecutor: {
          link: "/eventExecutor",
          icon: "home",
          title: "Executor"
        },
        socialMember: { link: "/home", icon: "home", title: "Member" }*/
      }
    };
  },
  methods: {
    isOperational() {
      contractService.isOperational();
    },
    checkRole() {
      contractService.role();
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
