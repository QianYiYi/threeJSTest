from fastapi import Depends, FastAPI, Request
from fastapi.security import OAuth2PasswordBearer
from starlette.responses import FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
import sys
import os
from server.io import file_read
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

common_dir_path = data_dir_path = os.path.dirname(
    os.path.abspath(__file__))+'/dataset'
# print(scene_list)
# exit(0)

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.mount("/frontend", StaticFiles(directory="frontend"))
app.mount("/dataset", StaticFiles(directory="dataset"))

templates = Jinja2Templates(directory="web")


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


@app.get("/")
async def get_index():
    return FileResponse('frontend/dist/index.html')


@app.get("/js/{name}")
async def get_js(name):
    return FileResponse('frontend/dist/js/'+name)


@app.get("/css/{name}")
async def get_css(name):
    return FileResponse('frontend/dist/css/'+name)


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
                'data': {'image': [os.path.join('/dataset', scene, 'image', 'front', frame+'.jpg'),
                                   os.path.join('/dataset', scene, 'image',
                                                'left', frame+'.jpg'),
                                   os.path.join('/dataset', scene, 'image', 'right', frame+'.jpg')],
                         'cali': [os.path.join('/dataset', scene, 'calib', 'left.json'),
                                  os.path.join(
                             '/dataset', scene, 'calib', 'front.json'),
                    os.path.join('/dataset', scene, 'calib', 'right.json')],
            'pcd': os.path.join('/dataset', scene, 'pcd', frame)+'.pcd',
            'label': os.path.join('/dataset', scene, 'label', frame)+'.json'}}
    elif(frame == 'undefined'):
        scene_list = file_read.list_all_scene(common_dir_path)
        file_read.list_all_pcd(os.path.join(
            common_dir_path, scene_list[0], 'pcd'))
        frame = file_read.frame_list_noext[0]
        return {'frame': file_read.frame_list_noext,
                'data': {'image': [os.path.join('/dataset', scene, 'image', 'front', frame+'.jpg'),
                                   os.path.join('/dataset', scene, 'image',
                                                'left', frame+'.jpg'),
                                   os.path.join('/dataset', scene, 'image', 'right', frame+'.jpg')],
                         'cali': [os.path.join('/dataset', scene, 'calib', 'left.json'),
                                  os.path.join(
                             '/dataset', scene, 'calib', 'front.json'),
                    os.path.join('/dataset', scene, 'calib', 'right.json')],
                    'pcd': os.path.join('/dataset', scene, 'pcd', frame)+'.pcd',
                    'label': os.path.join('/dataset', scene, 'label', frame)+'.json'}}
    else:
        return {'data': {'image': [os.path.join('/dataset', scene, 'image', 'front', frame+'.jpg'),
                                   os.path.join('/dataset', scene, 'image',
                                                'left', frame+'.jpg'),
                                   os.path.join('/dataset', scene, 'image', 'right', frame+'.jpg')],
                         'cali': [os.path.join('/dataset', scene, 'calib', 'left.json'),
                                  os.path.join(
                             '/dataset', scene, 'calib', 'front.json'),
            os.path.join('/dataset', scene, 'calib', 'right.json')],
            'pcd': os.path.join('/dataset', scene, 'pcd', frame)+'.pcd',
            'label': os.path.join('/dataset', scene, 'label', frame)+'.json'}}


# @ app.post("/annotate/")
# async def post_annotation(item: Item):
#     pass
