#!/usr/bin/env python3
"""Minimal MCP stdio JSON-RPC client — talks directly to an MCP server
subprocess, bypassing the harness's own tool-attachment layer, since that
layer has not picked up the newly-registered clear-thought/codegraph
servers in this running session.
"""
import json
import subprocess
import sys
import threading
import queue


class McpClient:
    def __init__(self, cmd, cwd=None):
        self.proc = subprocess.Popen(
            cmd, cwd=cwd, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, text=True, bufsize=1,
        )
        self._id = 0
        self._q = queue.Queue()
        self._reader = threading.Thread(target=self._read_loop, daemon=True)
        self._reader.start()
        self._stderr_lines = []
        self._err_reader = threading.Thread(target=self._read_stderr, daemon=True)
        self._err_reader.start()

    def _read_loop(self):
        for line in self.proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                self._q.put(json.loads(line))
            except json.JSONDecodeError:
                pass

    def _read_stderr(self):
        for line in self.proc.stderr:
            self._stderr_lines.append(line.rstrip())

    def _next_id(self):
        self._id += 1
        return self._id

    def send(self, method, params=None, notification=False):
        msg = {"jsonrpc": "2.0", "method": method}
        if params is not None:
            msg["params"] = params
        if not notification:
            msg["id"] = self._next_id()
        self.proc.stdin.write(json.dumps(msg) + "\n")
        self.proc.stdin.flush()
        return msg.get("id")

    def recv(self, timeout=30):
        return self._q.get(timeout=timeout)

    def call(self, method, params=None, timeout=30):
        wanted_id = self.send(method, params)
        while True:
            resp = self.recv(timeout=timeout)
            if resp.get("id") == wanted_id:
                return resp

    def initialize(self):
        resp = self.call("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "manual-verification-client", "version": "0.0.1"},
        })
        self.send("notifications/initialized", notification=True)
        return resp

    def list_tools(self):
        return self.call("tools/list", {})

    def call_tool(self, name, arguments, timeout=60):
        return self.call("tools/call", {"name": name, "arguments": arguments}, timeout=timeout)

    def close(self):
        try:
            self.proc.stdin.close()
        except Exception:
            pass
        self.proc.terminate()


def main():
    server = sys.argv[1]
    if server == "clear-thought":
        cmd = ["npx", "-y", "@waldzellai/clear-thought-onepointfive"]
    elif server == "codegraph":
        cmd = ["node", "/home/user/agent-armory/mcp-servers/codegraph-mcp/dist/index.js"]
    else:
        print("usage: mcp_client.py <clear-thought|codegraph> [call.json]", file=sys.stderr)
        sys.exit(1)

    client = McpClient(cmd)
    try:
        init = client.initialize()
        print("INIT:", json.dumps(init)[:500])
        tools = client.list_tools()
        print("TOOLS:", json.dumps(tools)[:2000])

        if len(sys.argv) > 2:
            call_spec = json.loads(sys.argv[2])
            result = client.call_tool(call_spec["name"], call_spec["arguments"], timeout=120)
            print("RESULT:")
            print(json.dumps(result, indent=2))
    finally:
        if client._stderr_lines:
            print("STDERR:", "\n".join(client._stderr_lines[-20:]), file=sys.stderr)
        client.close()


if __name__ == "__main__":
    main()
