import * as data from './data.js';
import * as io from './io.js';
import * as THREE from 'three';
import * as wgl from './three.js';

import {
    scene,
    renderer,
    camera,
    camera_l,
    camera_f,
    camera_t,
    controls,
    transformControls,
    selected,
    selectionBox,
    helper
} from './three.js';

export function init() {
    var select = document.getElementById("view_scene_select");
    if (select) {
        document.getElementById('view_scene_select').onchange = function () {
            if (data.params.current_scene != document.getElementById("view_scene_select").value) {
                data.params.current_scene = document.getElementById("view_scene_select").value;
                data.params.current_frame = undefined;
                io.load_frame(data.params.current_scene, data.params.current_frame);
            }
        };
    }

    select = document.getElementById("view_frame_select");
    if (select) {
        document.getElementById('view_frame_select').onchange = function () {
            data.params.current_frame = document.getElementById("view_frame_select").value;
            io.load_frame(data.params.current_scene, data.params.current_frame);
        };
    }
};