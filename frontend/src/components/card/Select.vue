<template>
  <div class="select-field">
    <el-select
      v-model="value"
      :placeholder="word"
      filterable
      :filter-method="filterData"
      allow-create
      size="mini"
      :popper-append-to-body="false"
      popper-class="popper"
      style="width: 100px"
      ref="select"
      @focus="focus"
      @visible-change="visibleChange"
    >
      <el-option
        v-for="item in options"
        :key="item"
        :label="item"
        :value="item"
      >
      </el-option>
      <el-option :label="value" :value="value" @click.native="addItem">
        <i class="el-icon-plus"></i>
        add
      </el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: "NewSelect",
  data() {
    return {
      value: "",
      inputFlag: null
    };
  },
  props: {
    word: {
      type: String,
      default: "",
    },
    options: {
      type: Array,
      default: [],
    },
  },
  methods: {
    filterData(val) {
      if (val) {
        this.value = val;
      }
    },
    addItem() {
      let val = this.value;
      if (val) {
        if (
          !this.options.some((item) => {
            if (item === val) {
              return true;
            }
          })
        ) {
          this.options.push(val);
        }
      }
    },
    setPopperColor() {
      this.r = Math.floor(Math.random() * 255);
      this.g = Math.floor(Math.random() * 255);
      this.b = Math.floor(Math.random() * 255);
      this.color = "rgba(" + this.r + "," + this.g + "," + this.b + ",0.8)";
    },
    focus() {
      if (this.inputFlag) {
        this.$refs.select.blur();
      }
    },
    visibleChange(val) {
      setTimeout(() => {
        this.inputFlag = val;
      }, 0);
    },
  },
};
</script>

<style>
.el-input .el-input__inner {
  background: none;
  color: white;
}

.el-input__inner {
  border: 0 !important;
}

.popper {
  background: rgba(80, 76, 76, 0.644) !important;
}

.el-select-dropdown__item > span {
  color: aliceblue;
}

.el-scrollbar__view .el-select-dropdown__list > li :hover {
  color: black;
}

.el-select-dropdown__item :hover {
  color: black;
}
</style>