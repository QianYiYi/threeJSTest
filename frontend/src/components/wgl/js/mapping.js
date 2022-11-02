import * as THREE from 'three';

export function coordinate(position, scale, rotation){
    /*var R_x = new THREE.Matrix3().set(
                                      1,          0,                     0, 
                                      0,          Math.cos(rotation.x),  -Math.sin(rotation.x),
                                      0,          Math.sin(rotation.x),   Math.cos(rotation.x));
    var R_y = new THREE.Matrix3().set(
                                      Math.cos(rotation.y),   0,      Math.sin(rotation.y),
                                      0,                      1,                  0,
                                      -Math.sin(rotation.y),   0,      Math.cos(rotation.y));*/
    var R_z = new THREE.Matrix3().set(
                                      Math.cos(rotation.z),    Math.sin(rotation.z),      0,
                                      -Math.sin(rotation.z),    Math.cos(rotation.z),     0,
                                      0,                        0,                        1);
    var pos = new THREE.Vector3();
    pos.set(position.x, position.y, position.z);
    var p_uvw = pos.applyMatrix3(R_z);
    var p1 = new THREE.Vector3().set((p_uvw.x - scale.x/2),(p_uvw.y - scale.y/2),(p_uvw.z + scale.z/2));
    var p2 = new THREE.Vector3().set((p_uvw.x - scale.x/2),(p_uvw.y + scale.y/2),(p_uvw.z + scale.z/2));
    var p3 = new THREE.Vector3().set((p_uvw.x + scale.x/2),(p_uvw.y + scale.y/2),(p_uvw.z + scale.z/2));
    var p4 = new THREE.Vector3().set((p_uvw.x + scale.x/2),(p_uvw.y - scale.y/2),(p_uvw.z + scale.z/2));
    var p5 = new THREE.Vector3().set((p_uvw.x + scale.x/2),(p_uvw.y - scale.y/2),(p_uvw.z - scale.z/2));
    var p6 = new THREE.Vector3().set((p_uvw.x + scale.x/2),(p_uvw.y + scale.y/2),(p_uvw.z - scale.z/2));
    var p7 = new THREE.Vector3().set((p_uvw.x - scale.x/2),(p_uvw.y + scale.y/2),(p_uvw.z - scale.z/2));
    var p8 = new THREE.Vector3().set((p_uvw.x - scale.x/2),(p_uvw.y - scale.y/2),(p_uvw.z - scale.z/2));
    var p = new Array(p1,p2,p3,p4,p5,p6,p7,p8);
    /*var R_x_inverse = new THREE.Matrix3().set(
                        1,   0,                     0,
                        0,   Math.cos(rotation.x),  Math.sin(rotation.x),
                        0,   -Math.sin(rotation.x), Math.cos(rotation.x));
    var R_y_inverse = new THREE.Matrix3().set(
                        Math.cos(rotation.y),  0,    -Math.sin(rotation.y),
                        0,                     1,    0,
                        Math.sin(rotation.y),  0,    Math.cos(rotation.z));*/
    var R_z_inverse = new THREE.Matrix3().set(
                        Math.cos(rotation.z),    -Math.sin(rotation.z),    0,
                        Math.sin(rotation.z),    Math.cos(rotation.z),     0,
                        0,                         0,                      1);
    var vertices = new Array();
    for(var i = 0; i < p.length; i++)
    {
        var p_xyz = p[i].applyMatrix3(R_z_inverse);
        vertices.push(p_xyz);
    }
    return vertices;
}

export function xyz_to_uv(intrinsic, extrinsic, x, y, z)
{
    var pointcloud = new THREE.Vector4();
    pointcloud.set(x,y,z,1);
    var res = new THREE.Matrix4();
    res.multiplyMatrices(intrinsic, extrinsic);
    var resu = pointcloud.applyMatrix4(res);
    var u = resu.x/resu.z;
    var v = resu.y/resu.z;
    var result = new THREE.Vector2().set(u, v);
    return result;
}

export function drawline(context, result_uv)
{
    context.beginPath();
    context.moveTo(result_uv[0].x/6.827, result_uv[0].y/10.24);
    for(var i = 1; i < result_uv.length/2; i++)
    {
        context.lineTo(result_uv[i].x/6.827, result_uv[i].y/10.24);
    }
    context.closePath();
    context.lineWidth = 0.5;
    context.strokeStyle = 'green';
    context.stroke();

    for(var i = 0; i < result_uv.length/2; i++)
    {
        context.beginPath();
        context.moveTo(result_uv[i].x/6.827, result_uv[i].y/10.24);
        context.lineTo(result_uv[result_uv.length-1-i].x/6.827, result_uv[result_uv.length-1-i].y/10.24);
        context.closePath();
        context.lineWidth = 0.5;
        context.strokeStyle = 'green';
        context.stroke();
    }

    context.beginPath();
    context.moveTo(result_uv[result_uv.length/2].x/6.827, result_uv[result_uv.length/2].y/10.24);
    for(var i = result_uv.length/2 + 1; i < result_uv.length; i++)
    {
        context.lineTo(result_uv[i].x/6.827, result_uv[i].y/10.24);
    }
    context.closePath();
    context.lineWidth = 0.5;
    context.strokeStyle = 'green';
    context.stroke();
}

export function crop_image(imgwidth, imgheight, canvaswidth, canvasheight, result_uv)
{
    var maxx = 0, maxy = 0, minx = imgwidth, miny = imgheight;
    for(var i =0; i < result_uv.length; i++){
        if(result_uv[i].x > maxx) maxx = result_uv[i].x;
        else if(result_uv[i].x < minx)  minx = result_uv[i].x;

        if(result_uv[i].y > maxy) maxy = result_uv[i].y;
        else if(result_uv[i].y < miny) miny = result_uv[i].y;
    }
    var targetWidth = (maxx - minx)*2.2;
    var targetHeight = (maxy - miny)*2.2;
    if(targetWidth > targetHeight)
    {
        targetHeight = targetWidth*miny/minx;
    }
    else
    {
        targetWidth = targetHeight*miny/minx;
    }
            
    if(targetWidth/targetHeight > canvaswidth/canvasheight)
    {
        targetHeight = targetHeight*canvasheight/canvaswidth;
    }
    else
    {
        targetWidth = targetHeight*canvaswidth/canvasheight;
    }

    var centerx = (maxx + minx)/2;
    var centery = (maxy + miny)/2;

    var star_x = centerx - targetWidth/2;
    var star_y = centery - targetHeight/2;
    if(star_x < 0) 
    { 
        targetWidth = targetWidth + star_x;
        star_x = 0;
    }
    if(star_y < 0) 
    { 
        targetHeight = targetHeight + star_y;
        star_y = 0;
    }
    return [star_x, star_y, targetWidth, targetHeight];
}

export function drawline_box(context, pixel_dot, tran_ratio_x, tran_ratio_y)
{
    context.beginPath();
    context.moveTo(pixel_dot[0].x*tran_ratio_x, pixel_dot[0].y*tran_ratio_y);
    for(var i = 1; i < pixel_dot.length/2; i++)
    {
        context.lineTo(pixel_dot[i].x*tran_ratio_x, pixel_dot[i].y*tran_ratio_y);
    }
    context.closePath();
    context.lineWidth = 0.8;
    context.strokeStyle = 'green';
    context.stroke();

    for(var i = 0; i < pixel_dot.length/2; i++)
    {
        context.beginPath();
        context.moveTo(pixel_dot[i].x*tran_ratio_x, pixel_dot[i].y*tran_ratio_y);
        context.lineTo(pixel_dot[pixel_dot.length-1-i].x*tran_ratio_x, pixel_dot[pixel_dot.length-1-i].y*tran_ratio_y);
        context.closePath();
        context.lineWidth = 0.8;
        context.strokeStyle = 'green';
        context.stroke();
    }

    context.beginPath();
    context.moveTo(pixel_dot[pixel_dot.length/2].x*tran_ratio_x, pixel_dot[pixel_dot.length/2].y*tran_ratio_y);
    for(var i = pixel_dot.length/2 + 1; i < pixel_dot.length; i++)
    {
        context.lineTo(pixel_dot[i].x*tran_ratio_x, pixel_dot[i].y*tran_ratio_y);
    }
    context.closePath();
    context.lineWidth = 0.8;
    context.strokeStyle = 'green';
    context.stroke();
}

export function get_pixel_dot(result_uv,crop_area)
{
    var pixel_dot = new Array();
    var start_x = crop_area[0];
    var start_y = crop_area[1];
    for(var i = 0; i < result_uv.length; i++)
    {
        var pixel_x = result_uv[i].x - start_x;
        var pixel_y = result_uv[i].y - start_y;
        var pixel_uv = new THREE.Vector2().set(pixel_x,pixel_y);
        pixel_dot.push(pixel_uv);
    }
    return pixel_dot;
}