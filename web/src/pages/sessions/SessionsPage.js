import { useEffect, useState } from "react";
import { Container, Card, Table, Button, Badge, Alert, Collapse, Form, InputGroup } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", variant: "info" });
  const [expanded, setExpanded] = useState(new Set());
  const [tokenLabel, setTokenLabel] = useState("agent-token");
  const [tokenDays, setTokenDays] = useState(365);
  const [generatedToken, setGeneratedToken] = useState("");

  const load = () => {
    setLoading(true);
    apiClient
      .get("/sessions")
      .then((res) => setSessions(res.data || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const generateToken = () => {
    setLoading(true);
    setGeneratedToken("");
    apiClient
      .post("/auth/api-token", { label: tokenLabel, ttl_days: Number(tokenDays) })
      .then((res) => {
        setGeneratedToken(res.data.token);
        setMessage({ text: `Token created — expires in ${tokenDays} days. Copy it now, it won't be shown again.`, variant: "success" });
        load();
      })
      .catch((err) =>
        setMessage({ text: err?.response?.data?.error || "Failed to generate token.", variant: "danger" })
      )
      .finally(() => setLoading(false));
  };

  const revoke = (id) => {
    if (!window.confirm("Kick this session?")) return;
    setLoading(true);
    apiClient
      .delete(`/sessions/${id}`)
      .then(() => {
        setMessage({ text: "Session revoked.", variant: "success" });
        load();
      })
      .catch((err) =>
        setMessage({ text: err?.response?.data?.error || "Failed to revoke session.", variant: "danger" })
      )
      .finally(() => setLoading(false));
  };

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />

      <Card className="shadow-sm border-0 mb-4">
        <Card.Header>
          <h4 className="mb-0">Generate API Token</h4>
          <small className="text-muted">Create a long-lived token for agents or automation (stored as a revocable session)</small>
        </Card.Header>
        <Card.Body>
          {message.text && (
            <Alert variant={message.variant} dismissible onClose={() => setMessage({ text: "", variant: "info" })}>
              {message.text}
            </Alert>
          )}
          <div className="d-flex gap-2 flex-wrap align-items-end mb-3">
            <Form.Group>
              <Form.Label className="small">Label</Form.Label>
              <Form.Control
                size="sm"
                value={tokenLabel}
                onChange={(e) => setTokenLabel(e.target.value)}
                placeholder="e.g. agent-token"
                style={{ width: 180 }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small">Expires in (days)</Form.Label>
              <Form.Control
                size="sm"
                type="number"
                min={1}
                max={3650}
                value={tokenDays}
                onChange={(e) => setTokenDays(e.target.value)}
                style={{ width: 110 }}
              />
            </Form.Group>
            <Button size="sm" variant="outline-primary" onClick={generateToken}>
              Generate Token
            </Button>
          </div>
          {generatedToken && (
            <InputGroup>
              <Form.Control
                readOnly
                value={generatedToken}
                style={{ fontFamily: "monospace", fontSize: 12 }}
              />
              <Button
                variant="outline-secondary"
                onClick={() => { navigator.clipboard.writeText(generatedToken); }}
              >
                Copy
              </Button>
            </InputGroup>
          )}
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Header>
          <h4 className="mb-0">Active Sessions</h4>
          <small className="text-muted">Manage authenticated sessions</small>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>User</th>
                  <th>IP</th>
                  <th>User Agent</th>
                  <th>Status</th>
                  <th>Last Seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <>
                    <tr key={s.id} className={s.is_current ? "table-active" : ""}>
                      <td>
                        <span className="fw-semibold">{s.username || s.email}</span>
                        {s.is_current && (
                          <Badge bg="primary" className="ms-2">
                            You
                          </Badge>
                        )}
                        <br />
                        <small className="text-muted">{s.email}</small>
                      </td>
                      <td>{s.ip_address || "–"}</td>
                      <td className="text-truncate" style={{ maxWidth: 200 }}>
                        {s.user_agent || "–"}
                      </td>
                      <td>
                        {s.active ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <Badge bg="secondary">Revoked</Badge>
                        )}
                      </td>
                      <td>{new Date(s.last_seen || s.created_at).toLocaleString()}</td>
                      <td className="text-end">
                        {s.recent_activity?.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            className="me-2"
                            onClick={() => toggleExpand(s.id)}
                          >
                            {expanded.has(s.id) ? "▾ Activity" : "▸ Activity"}
                          </Button>
                        )}
                        {s.active && !s.is_current && (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => revoke(s.id)}
                          >
                            Kick
                          </Button>
                        )}
                      </td>
                    </tr>
                    {expanded.has(s.id) && (
                      <tr key={`${s.id}-activity`}>
                        <td colSpan={6} className="p-0">
                          <Collapse in={expanded.has(s.id)}>
                            <div className="px-4 py-2 bg-body-secondary border-top">
                              <small className="text-muted d-block mb-1 fw-semibold">
                                Recent activity for {s.username || s.email}
                              </small>
                              <table className="table table-sm mb-0">
                                <tbody>
                                  {(s.recent_activity || []).map((a, i) => (
                                    <tr key={i}>
                                      <td>
                                        <code>{a.action}</code>
                                      </td>
                                      <td className="text-muted">{a.resource || "–"}</td>
                                      <td className="text-muted text-end">
                                        {new Date(a.created_at).toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </Collapse>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-muted text-center">
                      No sessions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SessionsPage;
