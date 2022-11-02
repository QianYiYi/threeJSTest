<template>
  <div class="block">
    <div class="my-slider__tooltip" :style="style">
      <el-tag class="my-slider__tooltip-wrapper" size="mini">
        {{ currentFrame }}
      </el-tag>
    </div>
    <el-slider
      v-model="currentFrame"
      :step="1"
      @change="changeFrame"
      :show-tooltips="false"
      :format-tooltip="formatToolTip"
      :max="maxFrame"
      @input="input"
      disabled
    >
    </el-slider>
  </div>
</template>

<script>
export default {
  name: "NewSlider",
  data() {
    return {
      value: this.currentFrame,
    };
  },
  methods: {
    changeFrame() {},
    formatToolTip(val) {
      //this.$refs.slider1.setPosition(val);
      return val;
    },
    input(value) {
      this.$emit("change", value);
    },
  },
  computed: {
    style() {
      const length = this.maxFrame,
        progress = this.currentFrame,
        left = (progress / length) * 100;
      return {
        paddingLeft: `${left}%`,
      };
    },
  },
  props: {
    maxFrame: {
      type: Number,
      default: 100,
    },
    currentFrame: {
      type: Number,
      default: 0,
    },
  },
};
</script>

<style>
.el-slider__button {
  display: none !important;
}

.el-slider__bar {
  background: rgba(80, 76, 76, 1) !important;
}

.my-slider__tooltip {
  text-align: left;
}

.my-slider__tooltip-wrapper {
  height: 20px;
  transform: translateX(-50%);
  top: 50%;
  background: rgba(80, 76, 76, 0.4) !important;
  color: rgb(121, 121, 121) !important;
  border: none !important;
}
</style>