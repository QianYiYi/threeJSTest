import * as THREE from "three";
import {
    OrbitControls
} from "three/examples/jsm/controls/OrbitControls.js";
import {
    SelectionBox
} from "three/examples/jsm/interactive/SelectionBox.js";
import {
    SelectionHelper
} from "three/examples/jsm/interactive/SelectionHelper.js";

// import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";
import {
    v4 as uuidv4
} from "uuid";
import * as mapping from "./mapping.js";
import {
    Bbox,
    user_,
    scene_,
    frame_,
    select_,
    idMap
} from "./data.js";
import {
    fabric
} from "fabric";
import {
    Vector3
} from "three";
import * as io from "./io.js";

var scene, renderer, camera, controls, selected, selectionBox, helper;
// THREE.Cache.enabled = true;
var rate_of_expansion = 1.5;

export {
    scene,
    renderer,
    camera,
    controls,
    selected,
    selectionBox,
    helper
};

function clear_specify_bbox(mesh_box) {
    for (var i = scene_.bbox_list.length - 1; i >= 0; i--) {
        if (mesh_box.uuid == scene_.bbox_list[i].uuid) {
            if (mesh_box.children) {
                for (let j in mesh_box.children) {
                    var child = mesh_box.children[j];
                    scene.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.metrial) child.metrial.dispose();
                }
                mesh_box.children = [];
            }
            scene.remove(mesh_box);
            scene_.bbox_list.splice(i, 1);
            break;
        }
    }
}

export function clear_all_bbox() {
    if (scene_.bbox_list.length) {
        for (let i in scene_.bbox_list) {
            var mesh = scene_.bbox_list[i];
            if (mesh.children) {
                for (let j in mesh.children) {
                    var child = mesh.children[j];
                    scene.remove(child);
                    if (child.geometry) child.geometry.dispose();
                    if (child.metrial) child.metrial.dispose();
                }
                mesh.children = [];
            }
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.metrial) mesh.metrial.dispose();
        }
        scene_.bbox_list = [];
    }
}

function clear_frame(frame) {
    if (frame) {
        scene.remove(frame);
        frame.geometry.dipose();
        frame.metrial.dipose();
    }
}

function clear_all_frame() {
    if (scene_.frame_list.length) {
        for (let i in scene_.frame_list) {
            var mesh = scene_.frame_list[i];
            scene.remove(mesh);
            mesh.geometry.dipose();
            mesh.metrial.dipose();
        }
        scene_.frame_list = [];
    }
    clear_all_bbox();
}

export function update_mesh_pcd(
    position,
    color,
    baseMatrix = scene_.baseMatrix
) {
    // console.log(scene_.frame_list.length, user_.frame_max)
    if (scene_.frame_list.length < user_.frame_max) {
        //no full, push new mesh
        if (position && position.count) {
            var geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(
                    new Float32Array(position.count * 3),
                    3
                )
            );
            geometry.setAttribute(
                "color",
                new THREE.Float32BufferAttribute(
                    new Float32Array(position.count * 3 * 2).fill(1.0),
                    3
                )
            );
            geometry.setAttribute(
                "scale",
                new THREE.Float32BufferAttribute(
                    new Float32Array(position.count).fill(user_.point_size),
                    1
                ).setUsage(THREE.DynamicDrawUsage)
            );
            for (var i = 0; i < position.count; i++) {
                geometry.attributes.position.array[i * 3] = position.array[i * 3];
                geometry.attributes.position.array[i * 3 + 1] =
                    position.array[i * 3 + 1];
                geometry.attributes.position.array[i * 3 + 2] =
                    position.array[i * 3 + 2];
                if (color) {
                    geometry.attributes.color.array[i * 3] = color.array[i * 3];
                    geometry.attributes.color.array[i * 3 + 1] = color.array[i * 3 + 1];
                    geometry.attributes.color.array[i * 3 + 2] = color.array[i * 3 + 2];
                    //backup color
                    geometry.attributes.color.array[position.count * 3 + i * 3] =
                        color.array[i * 3];
                    geometry.attributes.color.array[position.count * 3 + i * 3 + 1] =
                        color.array[i * 3 + 1];
                    geometry.attributes.color.array[position.count * 3 + i * 3 + 2] =
                        color.array[i * 3 + 2];
                }
            }
            geometry.setDrawRange(0, position.count);
            geometry.computeBoundingSphere();
            var vertexShader = `
                uniform mat4 baseMatrix;
                attribute float scale;
                attribute vec3 color;
                varying vec3 fg_Color;
                void main() {
                    gl_Position = projectionMatrix* modelViewMatrix * baseMatrix * vec4(position, 1.0);
                    gl_PointSize = float(scale*1.0);
                    fg_Color=color;
                }
                `;
            var fragmentShader = `
                varying vec3 fg_Color;
                void main() {
                    if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
                    gl_FragColor = vec4( fg_Color, 1.0 );
                }
                `;
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    baseMatrix: {
                        type: "mat4",
                        value: baseMatrix,
                    },
                },
            });
            var mesh = new THREE.Points(geometry, material);
            scene.add(mesh);
            scene_.frame_list.push(mesh);
            scene_.frame_cur++;
        }
    } else if (scene_.frame_list.length > user_.frame_max) {
        //may frame_max change, clear all mesh
        console.log("pop tail", scene_.frame_list.length);
        while (scene_.frame_list.length > user_.frame_max && user_.frame_max >= 1) {
            var last_one = scene_.frame_list.pop();
            clear_frame(last_one);
        }
        console.log("pop tail finish", scene_.frame_list.length);
    } else {
        //repetitive update
        if (scene_.frame_cur >= scene_.frame_list.length) {
            scene_.frame_cur = 0;
        }
        var mesh = scene_.frame_list[scene_.frame_cur];
        if (position.count > mesh.geometry.attributes.position.count) {
            //need dispose old mesh and create new mesh
            console.log("rewrite", mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
            scene.remove(mesh);
            var geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                "position",
                new THREE.Float32BufferAttribute(
                    new Float32Array(position.count * 3),
                    3
                )
            );
            geometry.setAttribute(
                "color",
                new THREE.Float32BufferAttribute(
                    new Float32Array(position.count * 3 * 2).fill(1.0),
                    3
                ).setUsage(THREE.DynamicDrawUsage)
            );
            geometry.setAttribute(
                "scale",
                new THREE.Float32BufferAttribute(
                    new Float32Array(position.count).fill(user_.point_size),
                    1
                ).setUsage(THREE.DynamicDrawUsage)
            );
            for (var i = 0; i < position.count; i++) {
                geometry.attributes.position.array[i * 3] = position.array[i * 3];
                geometry.attributes.position.array[i * 3 + 1] =
                    position.array[i * 3 + 1];
                geometry.attributes.position.array[i * 3 + 2] =
                    position.array[i * 3 + 2];
                if (color) {
                    geometry.attributes.color.array[i * 3] = color.array[i * 3];
                    geometry.attributes.color.array[i * 3 + 1] = color.array[i * 3 + 1];
                    geometry.attributes.color.array[i * 3 + 2] = color.array[i * 3 + 2];
                    //backup color
                    geometry.attributes.color.array[position.count * 3 + i * 3] =
                        color.array[i * 3];
                    geometry.attributes.color.array[position.count * 3 + i * 3 + 1] =
                        color.array[i * 3 + 1];
                    geometry.attributes.color.array[position.count * 3 + i * 3 + 2] =
                        color.array[i * 3 + 2];
                }
            }
            geometry.setDrawRange(0, position.count);
            var vertexShader = `
                attribute float scale;
                attribute vec3 color;
                varying vec3 fg_Color;
                void main() {
                    gl_Position = projectionMatrix* modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = float(scale*1.0);
                    fg_Color=color;
                }
                `;
            var fragmentShader = `
                varying vec3 fg_Color;
                void main() {
                    if ( length( gl_PointCoord - vec2( 0.5, 0.5 ) ) > 0.475 ) discard;
                    gl_FragColor = vec4( fg_Color, 1.0 );
                }
                `;
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms: {
                    baseMatrix: {
                        type: "mat4",
                        value: baseMatrix,
                    },
                },
            });
            var mesh = new THREE.Points(geometry, material);
            mesh.sizeAttenuation(false);
            scene.add(mesh);
            scene_.frame_list[scene_.frame_cur]=mesh;
        } else {
            //just update geometry attributes
            for (var i = 0; i < position.count; i++) {
                mesh.geometry.attributes.position.array[i * 3] = position.array[i * 3];
                mesh.geometry.attributes.position.array[i * 3 + 1] =
                    position.array[i * 3 + 1];
                mesh.geometry.attributes.position.array[i * 3 + 2] =
                    position.array[i * 3 + 2];
                if (color) {
                    mesh.geometry.attributes.color.array[i * 3] = color.array[i * 3];
                    mesh.geometry.attributes.color.array[i * 3 + 1] =
                        color.array[i * 3 + 1];
                    mesh.geometry.attributes.color.array[i * 3 + 2] =
                        color.array[i * 3 + 2];
                    //backup color
                    mesh.geometry.attributes.color.array[position.count * 3 + i * 3] =
                        color.array[i * 3];
                    mesh.geometry.attributes.color.array[position.count * 3 + i * 3 + 1] =
                        color.array[i * 3 + 1];
                    mesh.geometry.attributes.color.array[position.count * 3 + i * 3 + 2] =
                        color.array[i * 3 + 2];
                } else {
                    mesh.geometry.attributes.color.array[i * 3] = 1.0;
                    mesh.geometry.attributes.color.array[i * 3 + 1] = 1.0;
                    mesh.geometry.attributes.color.array[i * 3 + 2] = 1.0;
                    //backup color
                    mesh.geometry.attributes.color.array[
                        position.count * 3 + i * 3
                    ] = 1.0;
                    mesh.geometry.attributes.color.array[
                        position.count * 3 + i * 3 + 1
                    ] = 1.0;
                    mesh.geometry.attributes.color.array[
                        position.count * 3 + i * 3 + 2
                    ] = 1.0;
                }
            }
            mesh.geometry.setDrawRange(0, position.count);
            mesh.geometry.computeBoundingSphere();
            mesh.geometry.attributes.position.needsUpdate = true;
            mesh.geometry.attributes.color.needsUpdate = true;
            mesh.material.size = user_.point_size;
            mesh.material.needsUpdate = true;
        }
        scene_.frame_list[scene_.frame_cur++] = mesh;
    }
}

export var update_mesh_bbox = (function (
    bbox,
    mesh_box = undefined,
    baseMatrix
) {
    //static define
    // let canvas = document.createElement("canvas");
    // canvas.width = 400;
    // canvas.height = 100;
    // let ctx = canvas.getContext("2d");
    // ctx.fillStyle = "#ffff00";
    // ctx.font = "20px arial";
    // ctx.lineWidth = 2;
    //closure
    return function (bbox, mesh_box, baseMatrix) {
        var color;
        switch (bbox.type) {
            case "Pedestrian":
                color = 0xff0000;
                break;
            case "Motor":
                color = 0xffff00;
                break;
            default:
                color = 0x00ff00;
                break;
        }
        bbox.position.applyMatrix4(baseMatrix);
        // bbox.size.applyMatrix4(baseMatrix);
        bbox.rotation.applyMatrix4(baseMatrix);
        if (!mesh_box) {
            //add mesh_box
            var mesh_box = new THREE.LineSegments(
                new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
                new THREE.MeshBasicMaterial({
                    color: color,
                })
            );
            // var mesh_box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({
            //     color: color,
            //     transparent: true, //开启透明度
            //     opacity: 0.3, //设置透明度具体值
            //     alphaTest: 0.2,
            // }));
            mesh_box.position.set(bbox.position.x, bbox.position.y, bbox.position.z);
            mesh_box.scale.set(bbox.size.x, bbox.size.y, bbox.size.z);
            mesh_box.rotation.set(bbox.rotation.x, bbox.rotation.y, bbox.rotation.z);
            //add bbox
            mesh_box.bbox = bbox;
            scene.add(mesh_box);
            scene_.bbox_list.push(mesh_box);

            //add label
            let canvas = document.createElement("canvas");
            canvas.width = 400;
            canvas.height = 100;
            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffff00";
            ctx.font = "20px arial";
            ctx.lineWidth = 2;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(String(bbox.type), 0, 20);
            ctx.fillText(idMap.get(String(bbox.id)), 0, 40);
            // let texture = new THREE.Texture(canvas);
            let material = new THREE.SpriteMaterial({
                map: new THREE.Texture(canvas),
            });
            mesh_box.children.sprite = new THREE.Sprite(material);
            mesh_box.children.sprite.material.map.needsUpdate = true;
            mesh_box.children.sprite.material.sizeAttenuation = false;
            mesh_box.children.sprite.scale.set(0.4, 0.1, 1);
            mesh_box.children.sprite.position.set(
                bbox.position.x,
                bbox.position.y,
                bbox.position.z + bbox.size.z
            );
            scene.add(mesh_box.children.sprite);
            //add arrow
            // var dir = new THREE.Vector3(1, 0, 0).applyQuaternion(mesh_box.quaternion);
            // const origin = new THREE.Vector3(
            //     bbox.position.x,
            //     bbox.position.y,
            //     bbox.position.z
            // );
            // mesh_box.children.arrow = new THREE.ArrowHelper(
            //     dir,
            //     origin,
            //     2,
            //     0xffff00,
            //     0.5,
            //     0.1
            // );
            // scene.add(mesh_box.children.arrow);
            return mesh_box;
        } else {
            //update mesh_box
            mesh_box.position.set(bbox.position.x, bbox.position.y, bbox.position.z);
            mesh_box.scale.set(bbox.size.x, bbox.size.y, bbox.size.z);
            mesh_box.rotation.set(bbox.rotation.x, bbox.rotation.y, bbox.rotation.z);
            //add bbox
            mesh_box.bbox = bbox;
            //add label
            let canvas = document.createElement("canvas");
            canvas.width = 100;
            canvas.height = 60;
            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffff00";
            ctx.font = "20px arial";
            ctx.lineWidth = 2;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(String(bbox.type), 0, 20);
            ctx.fillText(idMap.get(String(bbox.id)), 0, 40);
            mesh_box.children.sprite.material.map = new THREE.Texture(canvas);
            mesh_box.children.sprite.material.map.needsUpdate = true;
            mesh_box.children.sprite.material.sizeAttenuation = false;
            mesh_box.children.sprite.scale.set(0.4, 0.1, 1);
            mesh_box.children.sprite.position.set(
                bbox.position.x,
                bbox.position.y,
                bbox.position.z + bbox.size.z / 2
            );
            //add arrow
            // var dir = new THREE.Vector3(1, 0, 0).applyQuaternion(mesh_box.quaternion);
            // const origin = new THREE.Vector3(
            //     bbox.position.x,
            //     bbox.position.y,
            //     bbox.position.z
            // );
            // mesh_box.children.arrow = new THREE.ArrowHelper(
            //     dir,
            //     origin,
            //     2,
            //     0xffff00,
            //     0.5,
            //     0.1
            // );
            // scene.add(mesh_box.children.arrow);
            return mesh_box;
        }
    };
})();

export var flat_view_monitor = (function () {
    //left view
    var camera_l = new THREE.OrthographicCamera(-1, 1, -1, 1, 1, 20);
    camera_l.up = new THREE.Vector3(0, 0, 1);
    //front view
    var camera_f = new THREE.OrthographicCamera(-1, 1, -1, 1, 1, 20);
    camera_f.up = new THREE.Vector3(0, 0, 1);
    //top view
    var camera_t = new THREE.OrthographicCamera(-1, 1, -1, 1, 1, 20);
    var canvas_t, canvas_f, canvas_l;
    var rect_t, rect_f, rect_l;
    return function () {
        if (selected) {
            const v = new THREE.Vector3(
                selected.position.x,
                selected.position.y,
                selected.position.z + 2
            );
            var xy = v.project(camera);
            xy.x = ((xy.x + 1) / 2) * window.innerWidth;
            xy.y = (-(xy.y - 1) / 2) * window.innerHeight;
            var css = document.getElementById("select_hud");
            if (css.style.display == "inline-block") {
                css.style.left = String(xy.x) + "px";
                css.style.top = String(xy.y) + "px";
                // css.style.display = 'inline-block';
            }
            //focus selected mesh
            //1. get canvas's size
            var px_view_w = document
                .getElementById("top-focus")
                .getBoundingClientRect().width;
            var px_view_h = document
                .getElementById("top-focus")
                .getBoundingClientRect().height;
            //2.1 set camera_t focus on selected
            camera_t.position.copy(selected.position);
            var vec3 = new THREE.Vector3(0, 0, selected.scale.z + 1).applyQuaternion(
                selected.quaternion
            );
            camera_t.position.x += vec3.x;
            camera_t.position.y += vec3.y;
            camera_t.position.z += vec3.z;
            camera_t.left = camera_t.bottom = -Math.max(
                selected.scale.x,
                selected.scale.y
            );
            camera_t.right = camera_t.top = -camera_t.left;
            camera_t.far = (selected.scale.z + 1) * 2;
            camera_t.lookAt(selected.position);
            camera_t.up = new THREE.Vector3(1, 0, 0).applyQuaternion(
                selected.quaternion
            );
            camera_t.updateProjectionMatrix();
            renderer.setScissorTest(true);
            renderer.setScissor(0, window.innerHeight - 300, px_view_w, px_view_h);
            renderer.setViewport(0, window.innerHeight - 300, px_view_w, px_view_h);
            renderer.render(scene, camera_t);
            //2.2 add canvas_t monitor ,just once
            if (!canvas_t) {
                canvas_t = new fabric.Canvas("top-focus");
                canvas_t.on("mouse:over", function (e) {
                    if (!rect_t && selected) {
                        var rect_w =
                            Math.abs(selected.scale.y / (camera_t.right * 2)) * px_view_w;
                        var rect_h =
                            Math.abs(selected.scale.x / (camera_t.top * 2)) * px_view_h;
                        rect_t = new fabric.Rect({
                            left: (px_view_w - rect_w) / 2,
                            top: (px_view_h - rect_h) / 2,
                            opacity: 0,
                            width: rect_w,
                            height: rect_h,
                        });
                        canvas_t.add(rect_t);
                        canvas_t.setActiveObject(rect_t);
                    }
                });
                canvas_t.on("mouse:out", function (e) {
                    if (rect_t && e.target == null) {
                        canvas_t.remove(rect_t);
                        canvas_t.requestRenderAll();
                        rect_t = undefined;
                    }
                });
                canvas_t.on("object:modified", function (e) {
                    if (selected) {
                        var bbox = selected.bbox;
                        var px_dx =
                            e.target.left -
                            e.transform.original.left +
                            (e.target.width *
                                (e.target.scaleX - e.transform.original.scaleX)) /
                            2;
                        var px_w_unit = (camera_t.right * 2) / px_view_w;
                        bbox.size.y *= e.target.scaleX / e.transform.original.scaleX;
                        var px_dy =
                            e.target.top -
                            e.transform.original.top +
                            (e.target.height *
                                (e.target.scaleY - e.transform.original.scaleY)) /
                            2;
                        var px_h_unit = (camera_t.top * 2) / px_view_h;
                        bbox.size.x *= e.target.scaleY / e.transform.original.scaleY;

                        var vec3 = new THREE.Vector3(
                            -px_dy * px_h_unit,
                            -px_dx * px_w_unit,
                            0
                        ).applyQuaternion(selected.quaternion);
                        bbox.position.x += vec3.x;
                        bbox.position.y += vec3.y;
                        bbox.position.z += vec3.z;

                        if (e.transform.original.angle != e.target.angle) {
                            var axis = new THREE.Vector3(0, 0, -1).applyQuaternion(
                                selected.quaternion
                            );
                            var q = new THREE.Quaternion().setFromAxisAngle(
                                axis.normalize(),
                                THREE.Math.degToRad(e.target.angle)
                            );
                            selected.applyQuaternion(q);
                            e.target.angle = 0;
                            e.target.left = e.transform.original.left;
                            e.target.top = e.transform.original.top;
                        }
                        bbox.rotation = selected.rotation.toVector3();

                        var rect_w =
                            Math.abs(bbox.size.y / (Math.max(bbox.size.x, bbox.size.y) * 2)) *
                            px_view_w;
                        var rect_h =
                            Math.abs(bbox.size.x / (Math.max(bbox.size.x, bbox.size.y) * 2)) *
                            px_view_h;
                        e.target.scaleX = 1;
                        e.target.scaleY = 1;
                        e.target.width = rect_w;
                        e.target.height = rect_h;
                        e.target.left = (px_view_w - rect_w) / 2;
                        e.target.top = (px_view_h - rect_h) / 2;
                        update_mesh_bbox(bbox, selected, new THREE.Matrix4().identity());
                        update_select_box(selected);
                    }
                });
            }
            //2.3 set camera_l focus on selected
            camera_l.position.copy(selected.position);
            var vec3 = new THREE.Vector3(0, selected.scale.y + 1, 0).applyQuaternion(
                selected.quaternion
            );
            camera_l.position.x += vec3.x;
            camera_l.position.y += vec3.y;
            camera_l.position.z += vec3.z;
            camera_l.left = camera_l.bottom = -Math.max(
                selected.scale.x,
                selected.scale.z
            );
            camera_l.right = camera_l.top = -camera_l.left;
            camera_l.far = (selected.scale.y + 1) * 2;
            camera_l.lookAt(selected.position);
            camera_l.up = new THREE.Vector3(0, 0, 1).applyQuaternion(
                selected.quaternion
            );
            camera_l.updateProjectionMatrix();
            renderer.setScissorTest(true);
            renderer.setScissor(0, window.innerHeight - 500, px_view_w, px_view_h);
            renderer.setViewport(0, window.innerHeight - 500, px_view_w, px_view_h);
            renderer.render(scene, camera_l);
            //2.4 add canvas_l monitor ,just once
            if (!canvas_l) {
                canvas_l = new fabric.Canvas("left-focus");
                canvas_l.on("mouse:over", function (e) {
                    if (!rect_l && selected) {
                        var rect_w =
                            Math.abs(selected.scale.x / (camera_l.right * 2)) * px_view_w;
                        var rect_h =
                            Math.abs(selected.scale.z / (camera_l.top * 2)) * px_view_h;
                        rect_l = new fabric.Rect({
                            left: (px_view_w - rect_w) / 2,
                            top: (px_view_h - rect_h) / 2,
                            opacity: 0,
                            width: rect_w,
                            height: rect_h,
                        });
                        canvas_l.add(rect_l);
                        canvas_l.setActiveObject(rect_l);
                    }
                });
                canvas_l.on("mouse:out", function (e) {
                    if (rect_l && e.target == null) {
                        canvas_l.remove(rect_l);
                        canvas_l.requestRenderAll();
                        rect_l = undefined;
                    }
                });
                canvas_l.on("object:modified", function (e) {
                    var bbox = selected.bbox;
                    var px_dx =
                        e.target.left -
                        e.transform.original.left +
                        (e.target.width * (e.target.scaleX - e.transform.original.scaleX)) /
                        2;
                    var px_w_unit = (camera_f.right * 2) / px_view_w;
                    bbox.size.x *= e.target.scaleX / e.transform.original.scaleX;
                    var px_dy =
                        e.target.top -
                        e.transform.original.top +
                        (e.target.height *
                            (e.target.scaleY - e.transform.original.scaleY)) /
                        2;
                    var px_h_unit = (camera_f.top * 2) / px_view_h;
                    bbox.size.z *= e.target.scaleY / e.transform.original.scaleY;

                    var vec3 = new THREE.Vector3(
                        -px_dx * px_w_unit,
                        0,
                        -px_dy * px_h_unit
                    ).applyQuaternion(selected.quaternion);
                    bbox.position.x += vec3.x;
                    bbox.position.y += vec3.y;
                    bbox.position.z += vec3.z;

                    if (e.transform.original.angle != e.target.angle) {
                        var axis = new THREE.Vector3(0, -1, 0).applyQuaternion(
                            selected.quaternion
                        );
                        var q = new THREE.Quaternion().setFromAxisAngle(
                            axis.normalize(),
                            THREE.Math.degToRad(e.target.angle)
                        );
                        selected.applyQuaternion(q);
                        e.target.angle = 0;
                        e.target.left = e.transform.original.left;
                        e.target.top = e.transform.original.top;
                    }
                    bbox.rotation = selected.rotation.toVector3();

                    var rect_w =
                        Math.abs(bbox.size.x / (Math.max(bbox.size.x, bbox.size.z) * 2)) *
                        px_view_w;
                    var rect_h =
                        Math.abs(bbox.size.z / (Math.max(bbox.size.x, bbox.size.z) * 2)) *
                        px_view_h;
                    e.target.scaleX = 1;
                    e.target.scaleY = 1;
                    e.target.width = rect_w;
                    e.target.height = rect_h;
                    e.target.left = (px_view_w - rect_w) / 2;
                    e.target.top = (px_view_h - rect_h) / 2;
                    update_mesh_bbox(bbox, selected, new THREE.Matrix4().identity());
                    update_select_box(selected);
                });
            }
            //2.5 set camera_f focus on selected
            camera_f.position.copy(selected.position);
            var vec3 = new THREE.Vector3(selected.scale.x + 1, 0, 0).applyQuaternion(
                selected.quaternion
            );
            camera_f.position.x += vec3.x;
            camera_f.position.y += vec3.y;
            camera_f.position.z += vec3.z;
            camera_f.left = camera_f.bottom = -Math.abs(
                Math.max(selected.scale.y, selected.scale.z)
            );
            camera_f.right = camera_f.top = -camera_f.left;
            camera_f.far = (selected.scale.x + 1) * 2;
            camera_f.lookAt(selected.position);
            camera_f.up = new THREE.Vector3(0, 0, 1).applyQuaternion(
                selected.quaternion
            );
            camera_f.updateProjectionMatrix();
            renderer.setScissorTest(true);
            renderer.setScissor(0, window.innerHeight - 700, px_view_w, px_view_h);
            renderer.setViewport(0, window.innerHeight - 700, px_view_w, px_view_h);
            renderer.render(scene, camera_f);
            //2.6 add canvas_f monitor ,just once
            if (!canvas_f) {
                canvas_f = new fabric.Canvas("front-focus");
                canvas_f.on("mouse:over", function (e) {
                    if (!rect_f && selected) {
                        var rect_w =
                            Math.abs(selected.scale.y / (camera_f.right * 2)) * px_view_w;
                        var rect_h =
                            Math.abs(selected.scale.z / (camera_f.top * 2)) * px_view_h;
                        rect_f = new fabric.Rect({
                            left: (px_view_w - rect_w) / 2,
                            top: (px_view_h - rect_h) / 2,
                            opacity: 0,
                            width: rect_w,
                            height: rect_h,
                        });
                        canvas_f.add(rect_f);
                        canvas_f.setActiveObject(rect_f);
                    }
                });
                canvas_f.on("mouse:out", function (e) {
                    if (rect_f && e.target == null) {
                        canvas_f.remove(rect_f);
                        canvas_f.requestRenderAll();
                        rect_f = undefined;
                    }
                });
                canvas_f.on("object:modified", function (e) {
                    var bbox = selected.bbox;
                    var px_dx =
                        e.target.left -
                        e.transform.original.left +
                        (e.target.width * (e.target.scaleX - e.transform.original.scaleX)) /
                        2;
                    var px_w_unit = (camera_f.right * 2) / px_view_w;
                    bbox.size.y *= e.target.scaleX / e.transform.original.scaleX;
                    var px_dy =
                        e.target.top -
                        e.transform.original.top +
                        (e.target.height *
                            (e.target.scaleY - e.transform.original.scaleY)) /
                        2;
                    var px_h_unit = (camera_f.top * 2) / px_view_h;
                    bbox.size.z *= e.target.scaleY / e.transform.original.scaleY;

                    var vec3 = new THREE.Vector3(
                        0,
                        px_dx * px_w_unit,
                        -px_dy * px_h_unit
                    ).applyQuaternion(selected.quaternion);
                    bbox.position.x += vec3.x;
                    bbox.position.y += vec3.y;
                    bbox.position.z += vec3.z;

                    if (e.transform.original.angle != e.target.angle) {
                        var axis = new THREE.Vector3(-1, 0, 0).applyQuaternion(
                            selected.quaternion
                        );
                        var q = new THREE.Quaternion().setFromAxisAngle(
                            axis.normalize(),
                            THREE.Math.degToRad(e.target.angle)
                        );
                        selected.applyQuaternion(q);
                        e.target.angle = 0;
                        e.target.left = e.transform.original.left;
                        e.target.top = e.transform.original.top;
                    }
                    bbox.rotation = selected.rotation.toVector3();

                    var rect_w =
                        Math.abs(
                            bbox.size.y / (Math.abs(Math.max(bbox.size.y, bbox.size.z)) * 2)
                        ) * px_view_w;
                    var rect_h =
                        Math.abs(
                            bbox.size.z / (Math.abs(Math.max(bbox.size.y, bbox.size.z)) * 2)
                        ) * px_view_h;
                    e.target.scaleX = 1;
                    e.target.scaleY = 1;
                    e.target.width = rect_w;
                    e.target.height = rect_h;
                    e.target.left = (px_view_w - rect_w) / 2;
                    e.target.top = (px_view_h - rect_h) / 2;
                    update_mesh_bbox(bbox, selected, new THREE.Matrix4().identity());
                    update_select_box(selected);
                });
            }
        }
    };
})();

export function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("main_view"),
        alpha: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = true;

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.rotation.order = "XYZ";

    // camera.rotation.order = 'YZX';
    camera.up = new THREE.Vector3(0, 0, 1);
    camera.position.z = 10;
    camera.lookAt(0, 0, 0);

    controls = new OrbitControls(camera, renderer.domElement);

    var grid = new THREE.GridHelper(100, 200, 0xffff00, 0xffff00);
    // grid.material.opacity = 0.15;
    // grid.material.transparent = true;
    // grid.rotation.z += 90.0 * Math.PI / 180;
    // grid.position.x -= 10;
    // scene.add(grid);

    var axesHelper = new THREE.AxesHelper(1);
    scene.add(axesHelper);

    // obj_gui = new GUI();
    // obj_gui.domElement.id = 'gui';
    selectionBox = new SelectionBox(camera, renderer);
    helper = new SelectionHelper(selectionBox, renderer, "noselectBox");

    add_event_listener();
}

export function animate() {
    // delete over mesh
    renderer.clear();
    renderer.setScissorTest(false);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    // renderer.setClearColor(0x000000, 1);
    renderer.render(scene, camera);
    //update select mesh_box if selected
    flat_view_monitor();
    requestAnimationFrame(animate);
}

export var track_view = function () {
    if (selected) {
        controls.saveState();
        controls.target = new THREE.Vector3(
            selected.position.x,
            selected.position.y,
            selected.position.z
        );
        camera.position.add(controls.target0.negate()).add(controls.target);
        camera.lookAt(selected.position);
        controls.update();
    } else {
        controls.reset();
    }
};

export function update_select_box(
    mesh_box = undefined,
    baseMatrix = scene_.baseMatrix
) {
    if (!mesh_box) {
        //no selected, restore color
        var position =
            scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.position;
        var color =
            scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.color;
        var scale =
            scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.scale;
        for (let i = 0; i < position.count; i++) {
            color.array[i * 3] = color.array[position.count * 3 + i * 3];
            color.array[i * 3 + 1] = color.array[position.count * 3 + i * 3 + 1];
            color.array[i * 3 + 2] = color.array[position.count * 3 + i * 3 + 2];
            scale.array[i] = user_.point_size;
        }
        color.needsUpdate = true;
        scale.needsUpdate = true;
    } else {
        track_view();
        if (scene_.frame_list.length) {
            mesh_box.updateMatrixWorld();

            var box3 = new THREE.Box3().setFromObject(mesh_box);
            var box3_helper = new THREE.Box3Helper(box3, 0xffff00);
            box3_helper.updateMatrixWorld();

            var position =
                scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.position;
            var color =
                scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.color;
            var scale =
                scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.scale;
            if (!mesh_box.bbox) {
                mesh_box.bbox = new Bbox();
                var bbox = mesh_box.bbox;
                bbox.id = uuidv4();

                bbox.position = box3_helper.position;
                bbox.size = box3_helper.scale.multiplyScalar(2);
                bbox.rotation = box3_helper.rotation.toVector3();
            }
            var bbox = mesh_box.bbox;
            bbox.points_idx = [];


            var T = new THREE.Matrix4().compose(
                new THREE.Vector3(0, 0, 0),
                mesh_box.quaternion.clone().invert(),
                new THREE.Vector3(1, 1, 1)
            );
            T.multiply(
                new THREE.Matrix4().compose(
                    mesh_box.position.clone().negate(),
                    new THREE.Quaternion(),
                    new THREE.Vector3(1, 1, 1)
                )
            );

            for (let i = 0; i < position.count; i++) {
                let p = new THREE.Vector3(
                    position.array[i * 3],
                    position.array[i * 3 + 1],
                    position.array[i * 3 + 2]
                )
                    .applyMatrix4(baseMatrix)
                    .applyMatrix4(T);
                if (
                    Math.abs(p.x) <= bbox.size.x / 2 &&
                    Math.abs(p.y) <= bbox.size.y / 2 &&
                    Math.abs(p.z) <= bbox.size.z / 2
                ) {
                    color.array[i * 3] = 0;
                    color.array[i * 3 + 1] = 255;
                    color.array[i * 3 + 2] = 0;
                    scale.array[i] = 2 * user_.point_size;
                    bbox.points_idx.push(i);
                } else {
                    color.array[i * 3] = color.array[position.count * 3 + i * 3];
                    color.array[i * 3 + 1] = color.array[position.count * 3 + i * 3 + 1];
                    color.array[i * 3 + 2] = color.array[position.count * 3 + i * 3 + 2];
                    scale.array[i] = user_.point_size;
                }
            }
            color.needsUpdate = true;
            position.needsUpdate = true;
            scale.needsUpdate = true;
            window.changeInfo(
                String(bbox.position.x),
                String(bbox.position.y),
                String(bbox.position.z),
                String(bbox.size.x),
                String(bbox.size.y),
                String(bbox.size.z),
                String(bbox.type),
                String(bbox.id)
            );
            window.setType(String(bbox.type));
            var idList = []
            for (let [key, value] of idMap) {
                idList.push(value);
            }
            window.setIDList(idList);
            window.setId(idMap.get(String(bbox.id)));

            var vertices = mapping.coordinate(bbox.position, bbox.size, bbox.rotation);
            var canvas = document.getElementById('front-image');
            var context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            var baseMatrix_copy = scene_.baseMatrix.clone();
            var extend_extrinsic = new THREE.Matrix4();
            extend_extrinsic.multiplyMatrices(scene_.cameraFMatrixExternal, baseMatrix_copy.invert());
            extend_extrinsic.makeRotationX(3.14/180.0*92);
            var result_uv = new Array();
            for (var i = 0; i < vertices.length; i++) {
                var uv = mapping.xyz_to_uv(scene_.cameraFMatrixInternal, extend_extrinsic, vertices[i].x, vertices[i].y, vertices[i].z);
                result_uv.push(uv);
            }
            for(var i = 0; i < result_uv.length; i++)
            {
                if(result_uv[i].x < rate_of_expansion*io.img.width && result_uv[i].y < rate_of_expansion*io.img.height)
                {
                    var crop_area = mapping.crop_image(io.img.width, io.img.height, canvas.width, canvas.height, result_uv);
                    context.drawImage(io.img, crop_area[0], crop_area[1], crop_area[2], crop_area[3], 0, 0, canvas.width, canvas.height);
                    var pixel_dot = mapping.get_pixel_dot(result_uv, crop_area);
                    var tran_ratio_x = canvas.width / crop_area[2];
                    var tran_ratio_y = canvas.height / crop_area[3];
                    mapping.drawline_box(context, pixel_dot, tran_ratio_x, tran_ratio_y);
                }
                else
                {
                    context.drawImage(io.img, 0, 0, canvas.width, canvas.height);
                }
            }
            var canvas_l = document.getElementById('left-image');
            var context_l = canvas_l.getContext('2d');
            context_l.clearRect(0, 0, canvas_l.width, canvas_l.height);
            var extend_extrinsic_l = new THREE.Matrix4();
            extend_extrinsic_l.multiplyMatrices(scene_.cameraLMatrixExternal, baseMatrix_copy.invert());
            extend_extrinsic_l.makeRotationX(3.14/180.0*92);
            var result_uv_l = new Array();
            for (var i = 0; i < vertices.length; i++) {
                var uv_l = mapping.xyz_to_uv(scene_.cameraLMatrixInternal, extend_extrinsic_l, vertices[i].x, vertices[i].y, vertices[i].z);
                result_uv_l.push(uv_l);
            }
            for(var i = 0; i < result_uv_l.length; i++)
            {
                if(result_uv_l[i].x < rate_of_expansion*io.img1.width && result_uv_l[i].y < rate_of_expansion*io.img1.height)
                {
                    var crop_area_l = mapping.crop_image(io.img1.width, io.img1.height, canvas_l.width, canvas_l.height, result_uv_l);
                    context_l.drawImage(io.img1, crop_area_l[0], crop_area_l[1], crop_area_l[2], crop_area_l[3], 0, 0, canvas_l.width, canvas_l.height);
                    var pixel_dot_l = mapping.get_pixel_dot(result_uv_l, crop_area_l);
                    var tran_ratio_x_l = canvas_l.width / crop_area_l[2];
                    var tran_ratio_y_l = canvas_l.height / crop_area_l[3];
                    mapping.drawline_box(context_l, pixel_dot_l, tran_ratio_x_l, tran_ratio_y_l);
                }
                else
                {
                    context_l.drawImage(io.img1, 0, 0, canvas_l.width, canvas_l.height);
                }
            }

            var canvas_r = document.getElementById('right-image');
            var context_r = canvas_r.getContext('2d');
            context_r.clearRect(0, 0, canvas_r.width, canvas_r.height);
            var extend_extrinsic_r = new THREE.Matrix4();
            extend_extrinsic_r.multiplyMatrices(scene_.cameraLMatrixExternal, baseMatrix_copy.invert());
            extend_extrinsic_r.makeRotationX(3.14/180.0*92);
            var result_uv_r = new Array();
            for (var i = 0; i < vertices.length; i++) {
                var uv_r = mapping.xyz_to_uv(scene_.cameraRMatrixInternal, extend_extrinsic_r, vertices[i].x, vertices[i].y, vertices[i].z);
                result_uv_r.push(uv_r);
            }
            for(var i = 0; i < result_uv_r.length; i++)
            {
                if(result_uv_r[i].x < rate_of_expansion*io.img2.width && result_uv_r[i].y < rate_of_expansion*io.img2.height)
                {
                    var crop_area_r = mapping.crop_image(io.img2.width, io.img2.height, canvas_r.width, canvas_r.height, result_uv_r);
                    context_r.drawImage(io.img2, crop_area_r[0], crop_area_r[1], crop_area_r[2], crop_area_r[3], 0, 0, canvas_r.width, canvas_r.height);
                    var pixel_dot_r = mapping.get_pixel_dot(result_uv_r, crop_area_r);
                    var tran_ratio_x_r = canvas_r.width / crop_area_r[2];
                    var tran_ratio_y_r = canvas_r.height / crop_area_r[3];
                    mapping.drawline_box(context_r, pixel_dot_r, tran_ratio_x_r, tran_ratio_y_r);
                }
                else
                {
                    context_r.drawImage(io.img2, 0, 0, canvas_r.width, canvas_r.height);
                }
            }
        }
    }
}

export function update_select_px(
    startPoint,
    endPoint,
    addordelete,
    baseMatrix = scene_.baseMatrix
) {
    if (scene_.frame_list.length) {
        var position =
            scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.position;
        var color =
            scene_.frame_list[scene_.frame_cur - 1].geometry.attributes.color;
        //create new bbox or get specify bbox in list
        var bbox;
        if (selected) bbox = selected.bbox;
        else {
            bbox = new Bbox();
            bbox.id = uuidv4();
        }
        //change color of points in selected range
        //1.1 add points mode
        if (addordelete == true) {
            for (let i = 0; i < position.count; i++) {
                const v = new THREE.Vector3(
                    position.array[i * 3],
                    position.array[i * 3 + 1],
                    position.array[i * 3 + 2]
                ).applyMatrix4(baseMatrix);
                var xy = v.project(camera);
                if (
                    (startPoint.x >= xy.x && xy.x >= endPoint.x) ||
                    (startPoint.x <= xy.x && xy.x <= endPoint.x)
                ) {
                    if (
                        (startPoint.y >= xy.y && xy.y >= endPoint.y) ||
                        (startPoint.y <= xy.y && xy.y <= endPoint.y)
                    ) {
                        if (bbox.points_idx.indexOf(i) == -1) {
                            // const v = new THREE.Vector3(position.array[i * 3], position.array[i * 3 + 1], position.array[i * 3 + 2]);
                            // const c = new THREE.Vector3(color.array[i * 3], color.array[i * 3 + 1], color.array[i * 3 + 2]);
                            color.array[i * 3] = 0;
                            color.array[i * 3 + 1] = 255;
                            color.array[i * 3 + 2] = 0;
                            bbox.points_idx.push(i);
                        }
                    }
                }
            }
        } else {
            //1.2 cut points mode
            if (bbox.points_idx.length) {
                for (let i = bbox.points_idx.length; i >= 0; i--) {
                    var idx = bbox.points_idx[i];
                    const v = new THREE.Vector3(
                        position.array[idx * 3],
                        position.array[idx * 3 + 1],
                        position.array[idx * 3 + 2]
                    ).applyMatrix4(baseMatrix);
                    var xy = v.project(camera);
                    if (
                        (startPoint.x >= xy.x && xy.x >= endPoint.x) ||
                        (startPoint.x <= xy.x && xy.x <= endPoint.x)
                    ) {
                        if (
                            (startPoint.y >= xy.y && xy.y >= endPoint.y) ||
                            (startPoint.y <= xy.y && xy.y <= endPoint.y)
                        ) {
                            color.array[idx * 3] = color.array[position * 3 + idx * 3];
                            color.array[idx * 3 + 1] =
                                color.array[position * 3 + idx * 3 + 1];
                            color.array[idx * 3 + 2] =
                                color.array[position * 3 + idx * 3 + 2];
                            bbox.points_idx.splice(i, 1);
                        }
                    }
                }
            }
        }
        //TODO
        /*
            send idx_list to backend, get param(type,heading angle ...), points index of obj
            */
        //change color from type
        // for (let i = 0; i < bbox.points_idx.length; i++) {
        //     color.array[bbox.points_idx[i] * 3] = 255;
        //     color.array[bbox.points_idx[i] * 3 + 1] = 0;
        //     color.array[bbox.points_idx[i] * 3 + 2] = 0;
        // }
        color.needsUpdate = true;
        position.needsUpdate = true;
        //update bbox
        if (bbox.points_idx.length) {
            var pos_list = [];
            for (let i = 0; i < bbox.points_idx.length; i++) {
                var idx = bbox.points_idx[i];
                pos_list.push(
                    new THREE.Vector3(
                        position.array[idx * 3],
                        position.array[idx * 3 + 1],
                        position.array[idx * 3 + 2]
                    )
                );
            }

            var box3 = new THREE.Box3().setFromPoints(pos_list);
            var box3_helper = new THREE.Box3Helper(box3, 0xffff00);
            box3_helper.updateMatrixWorld();
            bbox.position = box3_helper.position;
            bbox.size = box3_helper.scale.multiplyScalar(2);
            bbox.rotation = box3_helper.rotation.toVector3();
            selected = update_mesh_bbox(bbox, selected, scene_.baseMatrix);
        } else {
            //delete mesh
            if (selected) {
                clear_specify_bbox(selected);
                selected = undefined;
            } else {
                //no yet create
            }
        }
    }
}

var mouse_start = new THREE.Vector2();
var mouse_end = new THREE.Vector2();

function add_event_listener() {
    window.addEventListener("keydown", function (event) {
        // console.log(event);
        //event.preventDefault();
        if (event.code == "ControlLeft") {
            controls.enableRotate = false;
            controls.enablePan = false;
            var css = document.getElementById("select_hud");
            css.style.display = "none";
        } else if (event.code == "Control") { } else if (event.code == "ShiftLeft") {
            // event.preventDefault();
        } else if (event.code == "Digit2") { }
    });

    window.addEventListener("keyup", function (event) {
        //event.preventDefault();
        if (event.code == "ControlLeft") {
            controls.enableRotate = true;
            controls.enablePan = true;
            if (selected) {
                var css = document.getElementById("select_hud");
                css.style.display = "inline-block";
            }
        } else if (event.code == "Control") { } else if (event.code == "ShiftLeft") {
            event.preventDefault();
        }
    });

    window.addEventListener(
        "resize",
        function (event) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        },
        true
    );

    document
        .getElementById("main_view")
        .addEventListener("mousemove", function (event) {
            if (event.ctrlKey) {
                if (helper.isDown) {
                    selectionBox.endPoint.set(
                        (event.clientX / window.innerWidth) * 2 - 1,
                        -(event.clientY / window.innerHeight) * 2 + 1,
                        0.5
                    );
                }
            }
        });

    window.addEventListener("contextmenu", function (event) {
        event.preventDefault();
    });

    document
        .getElementById("main_view")
        .addEventListener("pointerdown", function (event) {
            event.preventDefault();
            mouse_start.x = event.clientX;
            mouse_start.y = event.clientY;
            if (event.ctrlKey) {
                helper.element.classList.replace("noselectBox", "selectBox");
                selectionBox.startPoint.set(
                    (event.clientX / window.innerWidth) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1,
                    0.5
                );
            }
        });

    document
        .getElementById("main_view")
        .addEventListener("pointerup", function (event) {
            //catch a box mesh
            event.preventDefault();
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(scene_.bbox_list);
            //get mouse mode
            mouse_end.x = event.clientX;
            mouse_end.y = event.clientY;
            if (
                Math.abs(mouse_end.x - mouse_start.x) +
                Math.abs(mouse_end.y - mouse_start.y) >
                1
            ) {
                //mouse move mode
                if (event.ctrlKey) {
                    //mouse edit mode
                    user_.mouse_mode = 2;
                    helper.element.classList.replace("selectBox", "noselectBox");
                    selectionBox.endPoint.set(
                        (event.clientX / window.innerWidth) * 2 - 1,
                        -(event.clientY / window.innerHeight) * 2 + 1,
                        0.5
                    );
                    if (event.button == 0)
                        update_select_px(
                            selectionBox.startPoint,
                            selectionBox.endPoint,
                            true
                        );
                    else if (event.button == 2)
                        update_select_px(
                            selectionBox.startPoint,
                            selectionBox.endPoint,
                            false
                        );
                } else {
                    if (selected) {
                        user_.mouse_mode = 1;
                    } else {
                        user_.mouse_mode = 0;
                    }
                }
            } else {
                //mouse click mode
                if (event.button == 0) {
                    //left button
                    if (intersects.length > 0) {
                        //catch mesh
                        selected = intersects[0].object;
                        user_.mouse_mode = 1;
                        update_select_box(selected);
                    } else {
                        selected = undefined;
                        update_select_box(selected);
                        user_.mouse_mode = 0;
                    }
                    // var css = document.getElementById("menu");
                    // css.style.display = "none";
                } else if (event.button == 2) {
                    //right button
                    window.vue3.rightClick(event);
                    // var css = document.getElementById("menu");
                    // css.style.left = String(mouse_end.x) + 'px';
                    // css.style.top = String(mouse_end.y) + 'px';
                    // css.style.display = css.style.display == 'inline-block' ? "none" : 'inline-block';
                }
            }
            helper.element.classList.replace("selectBox", "noselectBox");
            mouse_end.x = mouse_start.x = 0;
            mouse_end.y = mouse_start.y = 0;
            if (selected) {
                var css = document.getElementById("select_hud");
                // css.style.left = String(xy.x) + 'px';
                // css.style.top = String(xy.y) + 'px';
                css.style.display = "inline-block";
                var infoBox = document.getElementById("info");
                infoBox.style.display = "block";
            } else {
                var css = document.getElementById("select_hud");
                // css.style.left = String(xy.x) + 'px';
                // css.style.top = String(xy.y) + 'px';
                css.style.display = "none";
                var infoBox = document.getElementById("info");
                infoBox.style.display = "none";
            }
        });
}