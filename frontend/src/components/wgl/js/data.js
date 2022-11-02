// import * as wgl from './three.js';
import * as THREE from "three";

export var params = {
  annotate_type: ["car", "person", "bike", "oth"],
  current_scene: undefined,
  current_scene_idx: undefined,
  annotation_list: [], //fill with Bbox
  select_idx: -1,
  bbox_mode: 0,
  points_mode: 0,
};


export function Bbox() {
  this.id = 0;
  this.type = "oth";
  this.position = undefined; //x, y, z
  this.size = undefined; //depth, width, height
  this.rotation = undefined; //yaw(z up), pitch(x right), roll(y, front)
  this.speed = 0;
  this.points_idx = [];
}

Bbox.prototype = {
  constructor: Bbox,
};

export var user_privilege = {
  token: undefined,
};

export var user_ = {
  decay_global_time: 0, //Overlay display pointcloud, no bbox
  decay_single_time: 0, //Overlay display single bbox, only works when select a box
  point_size: 2,
  frame_max: 1,
  mouse_mode: 0, //0: view, 1: select, 2: edit
};

export var scene_ = {
    name: undefined,
    type_list: [],
    frame_list: [],
    frame_idx: 0,
    frame_cur: 0,
    frame_max: 1,
    bbox_list: [],
    baseMatrix: new THREE.Matrix4().identity(),
    cameraFMatrixInternal: new THREE.Matrix4().identity(),
    cameraFMatrixExternal: new THREE.Matrix4().identity(),
    cameraLMatrixInternal: new THREE.Matrix4().identity(),
    cameraLMatrixExternal: new THREE.Matrix4().identity(),
    cameraRMatrixInternal: new THREE.Matrix4().identity(),
    cameraRMatrixExternal: new THREE.Matrix4().identity(),
}

export var frame_ = {
  // bbox_list: [],
  bbox_slt_idx: -1,
};

export var select_ = {
  x: 0,
  y: 0,
  z: 0,
  depth: 0,
  width: 0,
  height: 0,
  angle_h: 0,
  angle_v: 0,
  type: undefined,
  id: undefined,
};

export const idMap = new Map();
export const idTypes = [
  {
    type:"Car",
    id: "A0000",
    counts: 1,
  },
  {
    type:"Pedestrian",
    id: "B0000",
    counts: 1,
  },
  {
    type:"Motor",
    id: "C0000",
    counts: 1,
  },
  {
    type:"Other",
    id: "D0000",
    counts: 1,
  },
];

export function addIdTypes(type) {
  var n = idTypes.length;
  var head = String.fromCharCode(65 + n);
  var obj = {
    type: type,
    id: head + "00000",
    counts: 1,
  }
  idTypes.push(obj);
}

export function getIdTypes(type) {
  for (let i = 0; i < idTypes.length; i ++) {
    if (type === idTypes[i].type) {
      return idTypes[i].id;
    }
  }
  return null;
}

export function getIdCounts(type) {
  for (let i = 0; i < idTypes.length; i ++) {
    if (type === idTypes[i].type) {
      return ++ idTypes[i].counts;
    }
  }
  return null;
}


class base_bbox{
  static hashmap =  new Map();
  constructor(id)
  {
    //insert in hashmap
    this.position = new THREE.Vector3(0,0,0);
    this.size = new THREE.Vector3(0,0,0);
    this.rotation = new THREE.Vector3(0,0,0);
  }
}

class base_frame{

}