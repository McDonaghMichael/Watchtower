import { useEffect, useRef, useState } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import API_BASE_URL from "../api/config";
import { getToken } from "../utils/auth";

function AgentLogsModal({ serverId, serverName, show, onClose }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const bottomRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (!show || !serverId) return;

    setLines([]);
    setDone(false);

    const token = encodeURIComponent(getToken() || "");
    const url = `${API_BASE_URL}/server/${serverId}/agent/logs?token=${token}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("log", (e) => {
      setLines((prev) => [...prev, e.data]);
    });

    es.addEventListener("done", () => {
      setDone(true);
      es.close();
    });

    es.onerror = () => {
      setLines((prev) => [...prev, "⚠ Connection lost."]);
      setDone(true);
      es.close();
    };

    return () => es.close();
  }, [show, serverId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleClose = () => {
    esRef.current?.close();
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          Agent Logs — {serverName}
          <span className="ms-2">
            {done ? <Badge bg="secondary">Done</Badge> : <Badge bg="info" text="dark">Streaming…</Badge>}
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0 }}>
        <div
          style={{
            background: "#0d0d0d",
            color: "#d4d4d4",
            fontFamily: "monospace",
            fontSize: 12,
            padding: "1rem",
            minHeight: 340,
            maxHeight: 520,
            overflowY: "auto",
          }}
        >
          {lines.length === 0 && !done && (
            <span className="text-muted">Fetching logs…</span>
          )}
          {lines.map((line, i) => {
            const colour =
              line.includes("ERROR") || line.includes("error") ? "#f44747"
              : line.includes("WARN") || line.includes("warn") ? "#dcdcaa"
              : line.includes("status 401") ? "#f44747"
              : "#d4d4d4";
            return (
              <div key={i} style={{ color: colour, whiteSpace: "pre-wrap", marginBottom: 1 }}>
                {line}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AgentLogsModal;
