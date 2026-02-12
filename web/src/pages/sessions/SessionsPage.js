import { useEffect, useState } from "react";
import { Container, Card, Table, Button, Badge, Alert } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";

function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    apiClient
      .get("/sessions")
      .then((res) => setSessions(res.data || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const revoke = (id) => {
    setLoading(true);
    apiClient
      .delete(`/sessions/${id}`)
      .then(() => {
        setMessage("Session revoked");
        load();
      })
      .catch(() => setMessage("Failed to revoke session"))
      .finally(() => setLoading(false));
  };

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />
      <Card className="shadow-sm border-0">
        <Card.Header>
          <h4 className="mb-0">Active Sessions</h4>
          <small className="text-muted">Manage authenticated sessions</small>
        </Card.Header>
        <Card.Body>
          {message && <Alert variant="info">{message}</Alert>}
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>IP</th>
                  <th>User Agent</th>
                  <th>Active</th>
                  <th>Last Seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      {s.username || s.email} <small className="text-muted">({s.user_id})</small>
                    </td>
                    <td>{s.ip_address || "–"}</td>
                    <td className="text-truncate" style={{ maxWidth: 220 }}>
                      {s.user_agent || "–"}
                    </td>
                    <td>
                      {s.active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Revoked</Badge>}
                    </td>
                    <td>{new Date(s.last_seen || s.created_at).toLocaleString()}</td>
                    <td>
                      {s.active && (
                        <Button size="sm" variant="outline-danger" onClick={() => revoke(s.id)}>
                          Kick
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-muted text-center">
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
