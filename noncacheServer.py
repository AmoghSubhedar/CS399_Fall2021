# NoCacheHTTPServer.py

import http.server

PORT = 8000

class NoCacheHTTPRequestHandler(
    http.server.SimpleHTTPRequestHandler
):
    def send_response_only(self, code, message=None):
        super().send_response_only(code, message)
        self.send_header("Cache-Control", "no-cache, max-age=0, must-revalidate, no-store")
        self.send_header('Expires', '0')

if __name__ == '__main__':
    http.server.test(
        HandlerClass=NoCacheHTTPRequestHandler,
        port=PORT
    )