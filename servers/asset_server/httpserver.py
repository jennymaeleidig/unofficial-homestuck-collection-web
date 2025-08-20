#!/bin/python3
from http.server import BaseHTTPRequestHandler, HTTPServer, SimpleHTTPRequestHandler
import sys
import os

asset_dir = os.environ.get('ASSET_DIR', '/assets')

port = int(os.environ.get('ASSET_PACK_PORT', 7413))

host = '0.0.0.0'

class CORSRequestHandler(SimpleHTTPRequestHandler):

    def __init__(self, *args, directory=None, **kwargs):
        directory = asset_dir
        self.directory = os.fspath(directory)
        super(BaseHTTPRequestHandler, self).__init__(*args, **kwargs)
        
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        # self.send_header('Access-Control-Allow-Headers', '*')
        # self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        return super(CORSRequestHandler, self).end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

print("Listening on {}:{} at root {}".format(host, port, asset_dir))
httpd = HTTPServer((host, port), CORSRequestHandler)
httpd.serve_forever()
