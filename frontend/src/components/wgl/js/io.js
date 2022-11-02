import * as data from './data.js';
import * as wgl from './three.js';
import * as THREE from 'three';
import {
    PCDLoader
} from "three/examples/jsm/loaders/PCDLoader.js";
import {
    Bbox,
    user_,
    scene_,
    frame_,
    select_,
} from './data.js';
import {
    v4 as uuidv4
} from 'uuid';
var img = new Image(); var img1 = new Image();var img2 = new Image();
export {
    img, img1, img2
};

function xhr_request(method = 'GET', url, func = undefined, pkt = undefined) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (this.readyState != 4)
            return;
        if (this.status == 200) {
            if (func != undefined)
                func(this.responseText);

        }
    }
    xhr.open(method, url, true);
    if (pkt != undefined) {
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.send(pkt);
    } else
        xhr.send();
}

function websocket_request(method = 'GET', url, async = true) {

}

// var pull = xhr_request;
// export default pull;



export function save_annotation() {

}

export function init() {
    //init data.params
    // xhr_request('GET', '/annotate/index', function (ret) {
    //     var json_cfg = JSON.parse(ret);
    //     data.params = json_cfg;
    // });
    //pull all scene info, fill view_scene_select/view_frame_select in document
    load_frame(data.params.current_scene, data.params.current_frame);
}

export function load_cali_l(cali) {
    scene_.cameraFMatrixExternal.set(cali["extrinsic"][0],cali["extrinsic"][1],cali["extrinsic"][2],cali["extrinsic"][3],
                        cali["extrinsic"][4],cali["extrinsic"][5],cali["extrinsic"][6],cali["extrinsic"][7],
                        cali["extrinsic"][8],cali["extrinsic"][9],cali["extrinsic"][10],cali["extrinsic"][11],
                        cali["extrinsic"][12],cali["extrinsic"][13],cali["extrinsic"][14],cali["extrinsic"][15]);
    scene_.cameraFMatrixInternal.set(cali["intrinsic"][0],cali["intrinsic"][1],cali["intrinsic"][2],0,
                        cali["intrinsic"][3],cali["intrinsic"][4],cali["intrinsic"][5],0,
                        cali["intrinsic"][6],cali["intrinsic"][7],cali["intrinsic"][8],0,
                        0,0,0,1);
    // console.log(scene_.cameraFMatrixExternal);
    // console.log(scene_.cameraFMatrixInternal);
}

export function load_cali_f(cali) {
    scene_.cameraLMatrixExternal.set(cali["extrinsic"][0],cali["extrinsic"][1],cali["extrinsic"][2],cali["extrinsic"][3],
                        cali["extrinsic"][4],cali["extrinsic"][5],cali["extrinsic"][6],cali["extrinsic"][7],
                        cali["extrinsic"][8],cali["extrinsic"][9],cali["extrinsic"][10],cali["extrinsic"][11],
                        cali["extrinsic"][12],cali["extrinsic"][13],cali["extrinsic"][14],cali["extrinsic"][15]);
    scene_.cameraLMatrixInternal.set(cali["intrinsic"][0],cali["intrinsic"][1],cali["intrinsic"][2],0,
                        cali["intrinsic"][3],cali["intrinsic"][4],cali["intrinsic"][5],0,
                        cali["intrinsic"][6],cali["intrinsic"][7],cali["intrinsic"][8],0,
                        0,0,0,1);
    // console.log(scene_.cameraLMatrixExternal);
    // console.log(scene_.cameraLMatrixInternal);
}

export function load_cali_r(cali) {
    scene_.cameraRMatrixExternal.set(cali["extrinsic"][0],cali["extrinsic"][1],cali["extrinsic"][2],cali["extrinsic"][3],
                        cali["extrinsic"][4],cali["extrinsic"][5],cali["extrinsic"][6],cali["extrinsic"][7],
                        cali["extrinsic"][8],cali["extrinsic"][9],cali["extrinsic"][10],cali["extrinsic"][11],
                        cali["extrinsic"][12],cali["extrinsic"][13],cali["extrinsic"][14],cali["extrinsic"][15]);
    scene_.cameraRMatrixInternal.set(cali["intrinsic"][0],cali["intrinsic"][1],cali["intrinsic"][2],0,
                        cali["intrinsic"][3],cali["intrinsic"][4],cali["intrinsic"][5],0,
                        cali["intrinsic"][6],cali["intrinsic"][7],cali["intrinsic"][8],0,
                        0,0,0,1);
    // console.log(scene_.cameraRMatrixExternal);
    // console.log(scene_.cameraRMatrixInternal);
}

export function load_cali(cali) {
    scene_.baseMatrix.set(cali["axis_trans"][0],cali["axis_trans"][4],cali["axis_trans"][8],cali["axis_trans"][12],
                        cali["axis_trans"][1],cali["axis_trans"][5],cali["axis_trans"][9],cali["axis_trans"][13],
                        cali["axis_trans"][2],cali["axis_trans"][6],cali["axis_trans"][10],cali["axis_trans"][14],
                        cali["axis_trans"][3],cali["axis_trans"][7],cali["axis_trans"][11],cali["axis_trans"][15]);
}

export function load_pcd(str_path) {
    var ext = str_path.split('.').pop()
    if (ext == 'pcd') {
        var loader = new PCDLoader();
        loader.load(str_path,
            function (pcd) {
                var position = pcd.geometry.attributes.position;
                var color = pcd.geometry.attributes.color;
                // var normal = pcd.geometry.attributes.normal;
                wgl.update_mesh_pcd(position, color, scene_.baseMatrix);

            });
    }
}

function process_box_id(type, id) {
    if (!data.idMap.has(id)) {
        let head = data.getIdTypes(type);
        if (!head) return;
        let num = data.getIdCounts(type);
        if (!num) return;
        data.idMap.set(id, head + num);
    }
}

function load_bbox(_bbox) {
    var num_len = _bbox.split("\n").length;
    for (var k in _bbox.split("\n")) {
        var bbox = new data.Bbox();
        // bbox.type = _bbox.split("\n")[k].split(",")[8];
        switch (_bbox.split("\n")[k].split(",")[8]) {
            case 'ped':
                bbox.type = 'Pedestrian';
                break;
            case 'bik':
                bbox.type = 'Motor';
                break;
            case 'car':
                bbox.type = 'Car';
                break;
            default:
                bbox.type = 'Other';
                break;
        }
        bbox.id = _bbox.split("\n")[k].split(",")[0];
        bbox.position = new THREE.Vector3(Number(_bbox.split("\n")[k].split(",")[1]), Number(_bbox.split("\n")[k].split(",")[2]), Number(_bbox.split("\n")[k].split(",")[3]));
        bbox.size = new THREE.Vector3(Number(_bbox.split("\n")[k].split(",")[4]), Number(_bbox.split("\n")[k].split(",")[5]), Number(_bbox.split("\n")[k].split(",")[6]));
        bbox.rotation = new THREE.Vector3(Number(_bbox.split("\n")[k].split(",")[7], 0, 0));
        process_box_id(bbox.type, String(bbox.id));
        wgl.update_mesh_bbox(bbox, undefined, scene_.baseMatrix);
    }
}

export var save_bbox = function () {
    var json_ret = [];
    if (scene_.bbox_list.length) {
        for (let i in scene_.bbox_list) {
            var { ...bbox } = scene_.bbox_list[i].bbox;
            bbox.position.applyMatrix4(scene_.baseMatrix.invert());
            // bbox.size.applyMatrix4(scene_.baseMatrix.invert());
            bbox.rotation.applyMatrix4(scene_.baseMatrix.invert());
            json_ret.push({
                "id": bbox.id,
                "type": bbox.type,
                "speed": bbox.speed,
                "position": [bbox.position.x, bbox.position.y, bbox.position.z],
                "size": [bbox.size.x, bbox.size.y, bbox.size.z],
                "rotation": [bbox.rotation.x, bbox.rotation.y, bbox.rotation.z],
                "points_idx": bbox.points_idx
            })
        }
    }
    return JSON.stringify(json_ret);
}
export function load_frame(str_scene, int_index) {
    xhr_request('GET', '/annotate/metadata/?scene=' + String(str_scene) + '&frame=' + String(int_index), function (ret) {
        var json_ret = JSON.parse(ret); //sever_client
        if (json_ret) {
            //console.log(json_ret)
            wgl.clear_all_bbox();
            if (json_ret['scene']) {
                // console.log(json_ret['scene']);
                var select = document.getElementById("view_scene_select");
                if (select) {
                    select.length = 0;
                    for (var k in json_ret['scene']) {
                        select.add(new Option(json_ret['scene'][k]));
                    }
                }
                if (str_scene == undefined) {
                    data.scene_.name = json_ret['scene']
                }
            }
            if (json_ret['frame']) {
                // console.log(json_ret['frame']);
                var select = document.getElementById("view_frame_select");
                if (select) {
                    select.length = 0;
                    for (var k in json_ret['frame']) {
                        select.add(new Option(json_ret['frame'][k]));
                    }
                }

            }
            if (json_ret['frame_num']) {
                data.scene_.frame_max = Number(json_ret['frame_num']) - 1
                data.scene_.frame_idx = 0
            }
            if (data.params.current_scene == undefined) {
                var select = document.getElementById("view_scene_select");
                if (select)
                    data.params.current_scene = select.value;
            } else {
                var select = document.getElementById("view_scene_select");
                if (select)
                    select.value = data.params.current_scene;
            }
            if (data.params.current_frame == undefined) {
                var select = document.getElementById("view_frame_select");
                if (select) {
                    data.params.current_frame = select.value;
                }
            } else {
                var select = document.getElementById("view_frame_select");
                if (select) {
                    select.value = data.params.current_frame;
                }
            }
            // var pcd_path = window.location.host + json_ret['pcd']
            // scene_.baseMatrix.set(0, 1, 0, 0,
            //     0, 0, 1, 0,
            //     1, 0, 0, 0,
            //     0, 0, 0, 1);
            xhr_request('GET', json_ret['data']['cali'][0], function (ret) {
                load_cali_l(JSON.parse(ret));
            });
            xhr_request('GET', json_ret['data']['cali'][1], function (ret) {
                load_cali_f(JSON.parse(ret));
            });
            xhr_request('GET', json_ret['data']['cali'][2], function (ret) {
                load_cali_r(JSON.parse(ret));
            });
            xhr_request('GET', json_ret['data']['cali'][3], function (ret) {
                load_cali(JSON.parse(ret));
            });
            if (json_ret['data']['pcd'])
                load_pcd(json_ret['data']['pcd']);
            if (json_ret['data']['image']) {
                var images = json_ret['data']['image']
                // console.log(images)
                images.forEach(function (value) {
                    return window.location.host + value;
                });
                if (images.length) {
                    //var img = new Image();
                    img.src = images[0];
                    img.onload = function () {
                        var canvas = document.getElementById('front-image');
                        var context = canvas.getContext('2d');
                        context.drawImage(img, 0, 0, canvas.width, canvas.height);
                    }
                    //var img1 = new Image();
                    img1.src = images[1];
                    img1.onload = function () {
                        var canvas = document.getElementById('left-image');
                        var context = canvas.getContext('2d');
                        context.drawImage(img1, 0, 0, canvas.width, canvas.height);
                    }
                    //var img2 = new Image();
                    img2.src = images[2];
                    img2.onload = function () {
                        var canvas = document.getElementById('right-image');
                        var context = canvas.getContext('2d');
                        context.drawImage(img2, 0, 0, canvas.width, canvas.height);
                    }
                }
            }
            xhr_request('GET', json_ret['data']['label'], function (ret) {
                load_bbox(ret);
            });
        }
    });
}

export function save_frame(str_scene = data.scene_.name, int_index = data.scene_.frame_idx) {
    var str_ret = save_bbox();
    var xhr = new XMLHttpRequest();
    //使用HTTP POST请求与服务器交互数据
    xhr.open("POST", '/annotate/metadata/?scene=' + String(str_scene) + '&frame=' + String(int_index), true);
    //设置发送数据的请求格式
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onreadystatechange = function () {
        if (this.readyState != 4)
            return;
        if (this.status == 200) {
            if (xhr.getResponseHeader('content-type') === 'application/json') {
                var result = JSON.parse(xhr.responseText);
                //根据返回结果判断验证码是否正确
                if (result.code === -1) {
                    alert('验证码错误');
                }
                console.log("result", result);
            } else {
                console.log(xhr.responseText);
            }
        }
    }
    console.log(str_ret)
    xhr.send(str_ret);
}