"""Minimal stand-in for the Razorpay orders API.

Lets the payment flow be exercised end to end without real credentials or
network access. It issues gateway-shaped order ids and nothing else - payment
settlement is decided by the server's own HMAC check, which is the behaviour
actually under test.

Usage:  python backend/tests_razorpay_stub.py [port]
"""
import json
import sys
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8001


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if not self.path.endswith('/orders'):
            self.send_error(404)
            return

        length = int(self.headers.get('Content-Length') or 0)
        request = json.loads(self.rfile.read(length) or b'{}')

        body = json.dumps({
            'id': f'order_stub_{uuid.uuid4().hex[:12]}',
            'entity': 'order',
            'amount': request.get('amount'),
            'currency': request.get('currency', 'INR'),
            'receipt': request.get('receipt'),
            'status': 'created',
        }).encode()

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()