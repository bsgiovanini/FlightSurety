import Vue from "vue";
import Vuetify from "vuetify";
import VueRouter from "vue-router";
import routes from "./routes";
import VueRx from "vue-rx";

import AppVue from "./App.vue";

import "vuetify/dist/vuetify.min.css";

import currency from "v-currency-field";

import "v-currency-field/dist/index.css";

Vue.use(Vuetify);
Vue.use(VueRx);
Vue.use(currency);

const router = new VueRouter({
  routes // short for `routes: routes`
});
Vue.use(VueRouter);

new Vue({
  router,
  render: h => h(AppVue)
}).$mount("#app");
