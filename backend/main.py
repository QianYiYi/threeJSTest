
from typing import Dict, List, Optional
from fastapi import Depends, FastAPI, Request
from fastapi.security import OAuth2PasswordBearer
from starlette.responses import FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import sys
import os
from interface import file_read
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
import json

common_dir_path = data_dir_path = os.path.dirname(
    os.path.abspath(__file__))+'/data'
# print(scene_list)
# exit(0)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.mount("/public", StaticFiles(directory="../frontend"), name="public")
app.mount("/data", StaticFiles(directory="../dataset"), name="data")

# templates = Jinja2Templates(directory="web")


class annotation(BaseModel):
    pcd: bytes
    box: str
    image: list
    mat: str


class Item(BaseModel):
    cur_scene: str
    cur_frame: str
    scene_list: list
    frame_list_noext: list


class bbox(BaseModel):
    id: int
    type: str
    position: list
    size: list
    rotation: list
    speed: float
    points_idx: list


@app.get("/")
async def get_index():
    return FileResponse('../frontend/dist/index.html')


@app.get("/js/{name}")
async def get_js(name):
    return FileResponse('../frontend/dist/js/'+name)


@app.get("/css/{name}")
async def get_css(name):
    return FileResponse('../frontend/dist/css/'+name)


class User(BaseModel):
    user_id: int
    name: str


@app.post("/annotate/metadata/")
async def put_metadata(item: list, scene: str = 'undefined', frame: str = 'undefined'):
    print(scene,frame)
    frame = file_read.frame_list_noext[int(frame)]
    f = "../dataset/example/label/" + frame + ".txt"
    with open(f,"w") as file:
        for k in item:
            if (k["id"] != ""):
                file.write(str(k["id"]) + ",")
                file.write(str(k["position"][2]) + ",")
                file.write(str(k["position"][0]) + ",")
                file.write(str(k["position"][1]) + ",")
                file.write(str(k["size"][0]) + ",")
                file.write(str(k["size"][1]) + ",")
                file.write(str(k["size"][2]) + ",")
                file.write(str(k["rotation"][2]) + ",")
                file.write(str(k["type"]) + "\n")
    return {"res": "ok"}


@app.get("/annotate/metadata/")
async def get_metadata(scene: str = 'undefined', frame: str = 'undefined'):
    if(scene == 'undefined' and frame == 'undefined'):
        scene_list = file_read.list_all_scene(common_dir_path)
        file_read.list_all_pcd(os.path.join(
            common_dir_path, scene_list[0], 'pcd'))
        scene = scene_list[0]
        frame = file_read.frame_list_noext[0]
        return {'scene': list(scene_list),
                'frame': file_read.frame_list_noext,
                'frame_num': len(file_read.frame_list_noext),
                'data': {'image': [os.path.join('/data', scene, 'image', 'front', frame+'.jpg'),
                                   os.path.join('/data', scene, 'image',
                                                'left', frame+'.jpg'),
                                   os.path.join('/data', scene, 'image', 'right', frame+'.jpg')],
                         'cali': [os.path.join('/data', scene, 'calib', 'left.json'),
                                  os.path.join('/data', scene,
                                               'calib', 'front.json'),
                                  os.path.join('/data', scene,
                                               'calib', 'right.json'),
                                  os.path.join('/data', scene, 'calib', 'lidar.json')],
                         'pcd': os.path.join('/data', scene, 'pcd', frame)+'.pcd',
                         'label': os.path.join('/data', scene, 'label', frame)+'.txt'}}
    elif(frame == 'undefined'):
        scene_list = file_read.list_all_scene(common_dir_path)
        file_read.list_all_pcd(os.path.join(
            common_dir_path, scene_list[0], 'pcd'))
        frame = file_read.frame_list_noext[0]
        return {'frame': file_read.frame_list_noext,
                'frame_num': len(file_read.frame_list_noext),
                'data': {'image': [os.path.join('/data', scene, 'image', 'front', frame+'.jpg'),
                                   os.path.join('/data', scene, 'image',
                                                'left', frame+'.jpg'),
                                   os.path.join('/data', scene, 'image', 'right', frame+'.jpg')],
                         'cali': [os.path.join('/data', scene, 'calib', 'left.json'),
                                  os.path.join(
                             '/data', scene, 'calib', 'front.json'),
                             os.path.join('/data', scene,
                                          'calib', 'right.json'),
                             os.path.join('/data', scene, 'calib', 'lidar.json')],
                         'pcd': os.path.join('/data', scene, 'pcd', frame)+'.pcd',
                         'label': os.path.join('/data', scene, 'label', frame)+'.txt'}}
    else:
        frame = file_read.frame_list_noext[int(frame)]
        return {'data': {'image': [os.path.join('/data', scene, 'image', 'front', frame+'.jpg'),
                                   os.path.join('/data', scene, 'image',
                                                'left', frame+'.jpg'),
                                   os.path.join('/data', scene, 'image', 'right', frame+'.jpg')],
                         'cali': [os.path.join('/data', scene, 'calib', 'left.json'),
                                  os.path.join(
                             '/data', scene, 'calib', 'front.json'),
                             os.path.join('/data', scene,
                                          'calib', 'right.json'),
                             os.path.join('/data', scene, 'calib', 'lidar.json')],
                         'pcd': os.path.join('/data', scene, 'pcd', frame)+'.pcd',
                         'label': os.path.join('/data', scene, 'label', frame)+'.txt'}}


# @ app.post("/annotate/")
# async def post_annotation(item: Item):
#     pass
