#!/usr/bin/env python3
import os
import shutil
import sys

DATA_JSONS = [
    "version.json",
    "mspa.json",
    "social.json",
    "news.json",
    "music.json",
    "comics.json",
    "extras.json",
    "tweaks.json"
]

def main():
    if len(sys.argv) < 2:
        print("Usage: extract_data_jsons.py <ASSET_DIR>")
        sys.exit(1)
    asset_dir = sys.argv[1]
    src_dir = os.path.join(asset_dir, "archive", "data")
    dest_dir = os.path.join("src", "data")
    os.makedirs(dest_dir, exist_ok=True)
    for fname in DATA_JSONS:
        src_path = os.path.join(src_dir, fname)
        dest_path = os.path.join(dest_dir, fname)
        if not os.path.exists(src_path):
            print(f"Warning: {src_path} does not exist.")
            continue
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_path} -> {dest_path}")

if __name__ == "__main__":
    main()