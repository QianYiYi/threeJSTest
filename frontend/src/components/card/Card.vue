<template>
  <div class="card">
    <el-row class="row1">
      <el-col :span="10" :offset="0">
        <new-select
          :word="id"
          :options="idlist"
          style="margin-top: 5px"
        ></new-select>
      </el-col>
      <el-col :span="10" :offset="2">
        <new-select
          :word="type"
          style="margin-top: 5px"
          :options="defaultTypes"
        ></new-select>
      </el-col>
    </el-row>
    <div class="blank"></div>
    <el-row>
      <el-col :span="4" :offset="3">
        <el-button icon="el-icon-circle-plus" @click="addInfo"></el-button>
      </el-col>
      <el-col :span="4" :offset="0">
        <el-button icon="el-icon-remove" @click="deleteInfo"></el-button>
      </el-col>
      <el-col :span="4" :offset="0">
        <el-button icon="el-icon-info" @click="checkInfo"></el-button>
      </el-col>
      <el-col :span="4" :offset="0">
        <el-button icon="el-icon-success" @click="checkBox"></el-button>
      </el-col>
      <el-col :span="4" :offset="0">
        <el-button icon="el-icon-error" @click="deleteBox"></el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import NewSelect from "./Select.vue";
export default {
  name: "Card",
  components: { NewSelect },
  data() {
    return {
      id: "ID",
      idlist: [],
      type: "Type",
      dataX: "123",
      dataY: "123",
      dataZ: "123",
      dataA: "123",
      dataH: "123",
      dataLat: "123",
      dataLong: "123",
      defaultTypes: ["Car", "Pedestrian", "Motor"],
    };
  },
  mounted() {
    window.setType = this.setType;
    window.setId = this.setId;
    window.setIDList = this.setIDList;
  },
  methods: {
    addInfo() {
      console.log("hello");
    },
    deleteInfo() {},
    checkInfo() {},
    checkBox() {},
    deleteBox() {},
    setType(typeVal) {
      this.type = typeVal;
    },
    setId(id) {
      this.id = id;
    },
    setIDList(idList) {
      this.idlist = idList;
    },
  },
};
</script>

<style scoped>
.card {
  width: 225px;
  height: 70px;
  background: rgba(80, 76, 76, 0.644);
}

el-row {
  margin-left: 5px;
}

.row1 {
  margin-top: 5px;
  margin-left: 8px;
}

.icons {
  color: white;
}

.blank {
  height: 5px;
}

.el-button.el-button--default {
  min-width: 25px;
  min-height: 25px;
  padding: 0;
  margin: 0;
  background: none;
  border: none;
}

.el-button.el-button--default:hover {
  color: white;
}
</style>
