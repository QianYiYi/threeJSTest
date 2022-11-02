<template>
  <div>
    <canvas
      id="main_view"
      style="
        left: 0px;
        top: 0px;
        margin: 0px;
        width: 100%;
        height: 100%;
        position: absolute;
      "
    >
    </canvas>
    <card id="select_hud" class="select_gui"></card>
    <div class="footer">
      <new-slider
        :maxFrame="scene_.frame_max"
        :currentFrame="scene_.frame_idx"
      ></new-slider>
    </div>
  </div>

  <div style="top: 100px; position: absolute; width: 200px; height: 200px">
    <canvas
      id="top-focus"
      width="200"
      height="200"
      style="display: block"
    ></canvas>
  </div>
  <div style="top: 300px; position: absolute">
    <canvas
      id="left-focus"
      width="200"
      height="200"
      style="display: block"
    ></canvas>
  </div>
  <div style="top: 500px; position: absolute">
    <canvas
      id="front-focus"
      width="200"
      height="200"
      style="display: block"
    ></canvas>
  </div>

  <!-- <div style="right: 200px; top: 100px; position: absolute">
    <canvas
      id="left-image"
      style="width: 200px; height: 200px; position: absolute"
    ></canvas>
  </div>
  <div style="right: 200px; top: 300px; position: absolute">
    <canvas
      id="front-image"
      style="width: 200px; height: 200px; position: absolute"
    ></canvas>
  </div>
  <div style="right: 200px; top: 500px; position: absolute">
    <canvas
      id="right-image"
      style="width: 200px; height: 200px; position: absolute"
    ></canvas>
  </div> -->

  <div class="imageContainer">
    <canvas id="left-image" style="width: 200px; height: 200px"></canvas>
    <canvas id="front-image" style="width: 200px; height: 200px"></canvas>
    <canvas id="right-image" style="width: 200px; height: 200px"></canvas>
  </div>

  <div id="info" class="infoBoxContainer">
    <div class="infoBox">
      <div class="row1">
        <span>X: {{ dataX }}</span>
        <span>Y: {{ dataY }}</span>
        <span>Z: {{ dataZ }}</span>
      </div>
      <div class="row2">
        <span>W: {{ dataW }}</span>
        <span>h: {{ dataH }}</span>
        <span>d: {{ dataD }}</span>
      </div>
      <div class="row3">
        <span>Type: {{ box_type }}</span>
        <span>ID: {{ box_id }}</span>
      </div>
    </div>
  </div>

  <!-- <div
    id="debug_info"
    style="bottom: 0; position: absolute; color: rgb(224, 210, 210)"
  ></div> -->
</template>

<script>
import { main } from "./js/main.js";
import { params, scene_, frame_, select_ } from "./js/data.js";
import { save_frame, load_frame } from "./js/io.js";
import Card from "../card/Card.vue";
import NewSlider from "../Slider.vue";
import { shallowRef } from "vue";
import { menusEvent } from "vue3-menus";

const menus = shallowRef({
  menus: [
    {
      label: "Next Frame(2)",
      icon: "<i class='el-icon-caret-right' />",
      click: () => {
        window.vue3.frame_next();
      },
    },
    {
      label: "Previous Frame(1)",
      icon: "<i class='el-icon-caret-left' />",
      click: () => {
        window.vue3.frame_previous();
      },
    },
    {
      label: "Play/Pause(Space)",
      icon: "<i class='el-icon-video-play' />",
      click: () => {
        window.vue3.frame_play_pause();
      },
    },
    {
      label: "Save Frame(Enter)",
      icon: "<i class='el-icon-folder-checked' />",
      click: () => {
        window.vue3.frame_save();
      },
    },
  ],
  menusStyle: {
    background: "#343131",
  },
});

export default {
  name: "wgl",
  components: {
    Card,
    NewSlider,
  },
  data() {
    return {
      params,
      scene: 12345,
      frame: undefined,
      id: 0,
      x: 0,
      y: 0,
      z: 0,
      depth: 0,
      width: 0,
      height: 0,
      angle_h: 0,
      angle_v: 0,
      type: 0,
      maxFrame: 1000,
      frameVal: 500,
      scene_,
      frame_,
      select_,
      dataX: 12.3,
      dataY: 12.3,
      dataZ: 2.4,
      dataW: 12,
      dataH: 3,
      dataD: 5,
      box_type: "Pedestrain",
      box_id: "11111111111111111111",
    };
  },
  mounted() {
    main();
    window.changeInfo = this.changeInfo;
  },
  created() {
    window.vue3 = [];
    window.vue3.data = this.$data;
    window.vue3.play_back = this.play_back;
    window.vue3.frame_next = this.frame_next;
    window.vue3.frame_previous = this.frame_previous;
    window.vue3.frame_save = this.frame_save;
    window.vue3.rightClick = this.rightClick;
    document.onkeydown = function (event) {
      if (event.code == "Digit2") {
        //next frame
        vue3.frame_next();
      } else if (event.code == "Digit1") {
        //last frame
        vue3.frame_previous();
      }
    };
  },
  methods: {
    play(interval = 0) {},
    play_back() {
      console.log("play back");
    },
    pause() {},
    save() {
      console.log("save frame");
      save_frame();
    },
    clickMenu() {
      var menu = document.getElementById("menu");
      document.addEventListener("click", () => {
        menu.style.display = "none";
      });
    },
    frame_next() {
      //切换到下一帧
      if (this.scene_.frame_idx < this.scene_.frame_max) {
        this.scene_.frame_idx++;
        load_frame(this.scene_.name, this.scene_.frame_idx);
      }
    },
    frame_previous() {
      //切换到下一帧
      if (this.scene_.frame_idx > 0) {
        this.scene_.frame_idx--;
        load_frame(this.scene_.name, this.scene_.frame_idx);
      }
    },
    frame_play_pause() {},
    frame_save() {
      this.save();
    },
    setMaxFrame(val) {
      //设置滑块帧数
      this.maxFrame = val;
    },
    rightClick(event) {
      menusEvent(event, menus.value);
      event.preventDefault();
    },
    changeInfo(x, y, z, w, h, d, type_, id_) {
      this.dataX = x;
      this.dataY = y;
      this.dataZ = z;
      this.dataW = w;
      this.dataH = h;
      this.dataD = d;
      this.box_type = type_;
      this.box_id = id_;
    },
  },
};
</script>



<style>
body {
  /* overflow: hidden; */
  margin: 0;
  background-color: #f0f0f0;
  color: #000;
  touch-action: none;
  position: fixed;
}

.selectBox {
  border: 1px solid #55aaff;
  background-color: rgba(75, 160, 255, 0.3);
  position: fixed;
}

.noselectBox {
  position: fixed;
}

.select_gui {
  position: absolute;
  /* background-color: rgba(128, 206, 226, 0.733); */
  /* border: 5px solid #a14c4c; */
  margin: 2px;
  display: none;
  text-align: left;
  z-index: 1000;
}

#gui {
  position: absolute;
  top: 2px;
  left: 2px;
}

.footer {
  position: absolute;
  bottom: -16px;
  z-index: 100;
  width: 100%;
}

.imageContainer {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  width: 300px;
  z-index: 100;
  right: -100px;
  position: absolute;
}

.infoBoxContainer {
  display: none;
}

.infoBox {
  position: absolute;
  display: flex;
  justify-content: space-between;
  background-color: rgba(80, 76, 76, 0.644);
  font-size: 15px;
  color: yellow;
  width: auto;
  height: 20px;
  border: 1px solid rgb(53, 52, 52);
  z-index: 1000;
}

.row1 {
  display: flex;
  justify-content: space-around;
  margin-left: 10px;
  margin-right: 10px;
}

.row1 > span {
  margin-right: 10px;
}

.row2 {
  display: flex;
  justify-content: space-around;
  margin-right: 10px;
}

.row2 > span {
  margin-right: 10px;
}

.row3 > span {
  margin-right: 10px;
}
</style>