import { useEffect, useRef, useState } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import API_BASE_URL from "../api/config";
import { getToken } from "../utils/auth";

/**
 * InstallProgressModal
 *
 * Props:
 *   serverId   – number, the server being installed
 *   serverName – string, display name
 *   show       – boolean, whether the modal is visible
 *   onClose    – callback when the user dismisses
 */
function InstallProgressModal({ serverId, serverName, show, onClose }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const bottomRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    if (!show || !serverId) return;

    // Reset state each time we open for a server
    setLines([]);
    setDone(false);
    setError(false);

    const token = encodeURIComponent(getToken() || "");
    const url = `${API_BASE_URL}/server/${serverId}/install/stream?token=${token}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("log", (e) => {
      const line = e.data;
      setLines((prev) => [...prev, line]);
      // Track whether any error lines appear
      if (line.startsWith("✗") || line.toLowerCase().startsWith("error")) {
        setError(true);
      }
    });

    es.addEventListener("done", () => {
      setDone(true);
      es.close();
    });

    es.onerror = () => {
      setLines((prev) => [...prev, "⚠ Connection to progress stream lost."]);
      setDone(true);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [show, serverId]);

  // Auto-scroll to bottom as lines arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleClose = () => {
    esRef.current?.close();
    onClose();
  };

  const statusBadge = !done ? (
    <Badge bg="warning" text="dark">Installing…</Badge>
  ) : error ? (
    <Badge bg="danger">Failed</Badge>
  ) : (
    <Badge bg="success">Complete</Badge>
  );

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          Agent Installation — {serverName}
          <span className="ms-2">{statusBadge}</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0 }}>
        <div
          style={{
            background: "#0d0d0d",
            color: "#d4d4d4",
            fontFamily: "monospace",
            fontSize: 13,
            padding: "1rem",
            minHeight: 340,
            maxHeight: 480,
            overflowY: "auto",
          }}
        >
          {lines.length === 0 && !done && (
            <span className="text-muted">Connecting to server…</span>
          )}
          {lines.map((line, i) => {
            const colour =
              line.startsWith("✓") ? "#4ec9b0"
              : line.startsWith("✗") || line.toLowerCase().startsWith("error") ? "#f44747"
              : line.startsWith("$") ? "#9cdcfe"
              : line.startsWith("▶") ? "#dcdcaa"
              : "#d4d4d4";
            return (
              <div key={i} style={{ color: colour, whiteSpace: "pre-wrap", marginBottom: 2 }}>
                {line}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </Modal.Body>
      <Modal.Footer>
        {done && !error && (
          <span className="text-success me-auto small">
            ✓ Agent is running on port 8744
          </span>
        )}
        <Button variant={done ? "primary" : "secondary"} onClick={handleClose}>
          {done ? "Close" : "Close (installation continues in background)"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default InstallProgressModal;
