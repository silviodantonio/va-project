from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
import os

PORT = 7000
DIRECTORY = "srv"

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

os.chdir(DIRECTORY)
TCPServer.allow_reuse_address = True

print("FILESERVER STARTING", flush=True)

with TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print(f"Serving on port {PORT}", flush=True)
    httpd.serve_forever()