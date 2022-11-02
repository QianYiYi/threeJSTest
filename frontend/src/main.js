import { createApp } from "vue";
import App from "./App.vue";
import ElementPlus from "element-plus";
import "element-plus/lib/theme-chalk/index.css";
import Menus from "vue3-menus";

const app = createApp(App);
app.use(ElementPlus);
app.use(Menus);
app.mount("#app");
