<template>
  <div id="home">
    <wgl></wgl>
  </div>
</template>

<script>
import wgl from "./components/wgl/wgl.vue";
export default {
  name: "App",
  components: {
    wgl,
  },
};
</script>

<style>
html,
body {
  height: 100%;
  width: 100%;
  margin: 0px;
  padding: 0px;
}

#home {
  width: 100%;
  height: 100%;
}
</style>
