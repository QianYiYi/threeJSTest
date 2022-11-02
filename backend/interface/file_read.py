import os
import sys
from pathlib import Path

scene = None
frame_list_noext = []  # 0....9999999
frame_index = 0


def list_all_scene(common_dir_path):
    scene_list = []
    for path in os.listdir(common_dir_path):
        if Path(os.path.join(common_dir_path, path)).is_dir():
            scene_list.append(path)
            # print("is_dir")
    return scene_list


def get_next_frame():
    pass


def get_last_frame():
    pass


def get_frame(index):
    pass


def list_all_pcd(pcd_path):
    print(pcd_path)
    global frame_list_noext
    frame_list_noext = []
    for path in os.listdir(pcd_path):
        frame_list_noext.append(os.path.splitext(path)[0])
