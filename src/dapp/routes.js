import Airlines from "./Airlines.vue";
import Passenger from "./Passenger.vue";
import Admin from "./Admin.vue";

export default [
  {
    path: "/passenger",
    component: Passenger
  },
  {
    path: "/airlines",
    component: Airlines
  },
  {
    path: "/admin",
    component: Admin
  }
];
