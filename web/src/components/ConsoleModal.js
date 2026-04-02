import { useEffect, useRef, useState } from "react";
import { Modal, Button, Form, Badge } from "react-bootstrap";
import apiClient from "../api/client";

function ConsoleModal({ serverId, serverName, show, onClose }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cmdHistory, setCmdHistory] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) {
      setHistory([{ type: "info", text: `Connected to ${serverName} — type a command and press Enter.` }]);
      setInput("");
      setCmdHistory([]);
      setHistoryIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show, serverName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || loading) return;

    setHistory((prev) => [...prev, { type: "cmd", text: `$ ${cmd}` }]);
    setCmdHistory((prev) => [cmd, ...prev]);
    setHistoryIndex(-1);
    setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post(`/server/${serverId}/exec`, { command: cmd });
      const output = res.data?.output || "";
      const errMsg = res.data?.error || null;

      if (output) {
        output.split("\n").forEach((line) => {
          setHistory((prev) => [...prev, { type: "output", text: line }]);
        });
      }
      if (errMsg) {
        setHistory((prev) => [...prev, { type: "error", text: `⚠ ${errMsg}` }]);
      }
      if (!output && !errMsg) {
        setHistory((prev) => [...prev, { type: "muted", text: "(no output)" }]);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Request failed";
      setHistory((prev) => [...prev, { type: "error", text: `✗ ${msg}` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(historyIndex + 1, cmdHistory.length - 1);
      setHistoryIndex(next);
      setInput(cmdHistory[next] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(historyIndex - 1, -1);
      setHistoryIndex(next);
      setInput(next === -1 ? "" : cmdHistory[next] || "");
    }
  };

  const getColor = (type) => {
    switch (type) {
      case "cmd":    return "#7ee787";
      case "error":  return "#f44747";
      case "info":   return "#82b1ff";
      case "muted":  return "#6b7280";
      default:       return "#d4d4d4";
    }
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" backdrop="static">
      <Modal.Header closeButton style={{ background: "#1a1a1a", borderBottom: "1px solid #333" }}>
        <Modal.Title className="d-flex align-items-center gap-2" style={{ color: "#d4d4d4", fontSize: "1rem" }}>
          <span>⌨ Console</span>
          <span style={{ color: "#6b7280", fontWeight: 400 }}>— {serverName}</span>
          {loading && <Badge bg="warning" text="dark" style={{ fontSize: "0.7rem" }}>Running…</Badge>}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: 0, background: "#0d0d0d" }}>
        <div
          style={{
            background: "#0d0d0d",
            color: "#d4d4d4",
            fontFamily: "monospace",
            fontSize: 12,
            padding: "1rem",
            minHeight: 360,
            maxHeight: 480,
            overflowY: "auto",
          }}
          onClick={() => inputRef.current?.focus()}
        >
          {history.map((entry, i) => (
            <div
              key={i}
              style={{
                color: getColor(entry.type),
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                marginBottom: entry.type === "cmd" ? 2 : 1,
                fontWeight: entry.type === "cmd" ? 600 : 400,
              }}
            >
              {entry.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </Modal.Body>

      <Modal.Footer style={{ background: "#1a1a1a", borderTop: "1px solid #333", padding: "0.5rem 1rem" }}>
        <Form onSubmit={handleSubmit} className="d-flex w-100 gap-2">
          <span style={{ color: "#7ee787", fontFamily: "monospace", fontSize: 13, lineHeight: "31px" }}>$</span>
          <Form.Control
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command…"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            size="sm"
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#d4d4d4",
              fontFamily: "monospace",
              fontSize: 13,
              flex: 1,
            }}
          />
          <Button
            type="submit"
            variant="outline-success"
            size="sm"
            disabled={loading || !input.trim()}
          >
            Run
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </Form>
      </Modal.Footer>
    </Modal>
  );
}

export default ConsoleModal;
