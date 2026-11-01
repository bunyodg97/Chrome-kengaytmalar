"""Sinov uchun mock server: GraphQL introspection, OpenAPI, CORS."""
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

def T(kind, name=None, of=None): return {"kind": kind, "name": name, "ofType": of}
S = lambda n: T("SCALAR", n)
NN = lambda t: T("NON_NULL", None, t)
L = lambda t: T("LIST", None, t)
O = lambda n: T("OBJECT", n)
def F(name, typ, args=()): return {"name": name, "description": None, "isDeprecated": False, "args": [{"name": a, "type": t, "defaultValue": None} for a, t in args], "type": typ}
types = [
  {"kind": "OBJECT", "name": "Query", "fields": [F("user", O("User"), [("id", NN(S("ID")))]), F("users", NN(L(NN(O("User")))), [("role", T("ENUM", "Role"))]), F("node", T("INTERFACE", "Node"), [("id", NN(S("ID")))])], "possibleTypes": None},
  {"kind": "OBJECT", "name": "Mutation", "fields": [F("rename", O("User"), [("id", NN(S("ID"))), ("name", NN(S("String")))])], "possibleTypes": None},
  {"kind": "OBJECT", "name": "User", "fields": [F("id", NN(S("ID"))), F("name", S("String")), F("role", T("ENUM", "Role")), F("posts", L(O("Post")), [("first", S("Int"))])], "possibleTypes": None},
  {"kind": "OBJECT", "name": "Post", "fields": [F("title", S("String")), F("likes", S("Int"))], "possibleTypes": None},
  {"kind": "INTERFACE", "name": "Node", "fields": [F("id", NN(S("ID")))], "possibleTypes": [{"name": "User"}, {"name": "Post"}]},
  {"kind": "ENUM", "name": "Role", "fields": None, "enumValues": [{"name": "ADMIN"}, {"name": "USER"}], "possibleTypes": None},
] + [{"kind": "SCALAR", "name": n, "fields": None, "possibleTypes": None} for n in ("ID", "String", "Int", "Boolean")]
for t in types:
    t.setdefault("description", None); t.setdefault("inputFields", None); t.setdefault("enumValues", None)
SCHEMA = {"data": {"__schema": {"queryType": {"name": "Query"}, "mutationType": {"name": "Mutation"}, "subscriptionType": None, "types": types}}}

class H(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "*")
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get("content-length", 0))) or b"{}")
        q = body.get("query", "")
        res = SCHEMA if "__schema" in q else {"data": {"user": {"id": "1", "name": "Ali", "__typename": "User"}}, "echo": body}
        out = json.dumps(res).encode()
        self.send_response(200); self.cors(); self.send_header("content-type", "application/json"); self.end_headers(); self.wfile.write(out)
    def do_GET(self):
        self.send_response(200); self.cors()
        self.send_header("Strict-Transport-Security", "max-age=100"); self.send_header("X-Powered-By", "Express")
        self.send_header("content-type", "text/html"); self.end_headers(); self.wfile.write(b"<h1>ok</h1>")
    def log_message(self, *a): pass

HTTPServer(("127.0.0.1", 8766), H).serve_forever()
