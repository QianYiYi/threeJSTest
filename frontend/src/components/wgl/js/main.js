import * as io from './io.js';
import * as wgl from './three.js';
import * as interactive from './interactive.js';

export function main() {
    //init scene, camera, control ..
    wgl.init();
    io.init();
    //xhr, load init config and scene
    interactive.init();
    //init config list,such as type list and current index
    //xhr, load pcd and annotation data by index
    //scence add pcd, annotation[box,sprite text]
    //render loop
    wgl.animate();
}
