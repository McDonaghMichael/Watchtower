import { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col, Table, Badge, Alert } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";
import { getUser } from "../../utils/auth";

function TicketsPage() {
  const user = getUser();
  const isSupport = (user?.role_permissions || []).includes("support_manage");
  const [tickets, setTickets] = useState([]);
  const [filters, setFilters] = useState({ status: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: "", body: "" });
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");

  const load = () => {
    setLoading(true);
    apiClient
      .get("/tickets", { params: { status: filters.status } })
      .then((res) => setTickets(res.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filters.status]);

  const createTicket = () => {
    if (!newTicket.title || !newTicket.body) {
      setMessage("Title and body required");
      return;
    }
    setLoading(true);
    apiClient
      .post("/tickets", newTicket)
      .then(() => {
        setMessage("Ticket created");
        setNewTicket({ title: "", body: "" });
        load();
      })
      .catch(() => setMessage("Failed to create ticket"))
      .finally(() => setLoading(false));
  };

  const openTicket = (id) => {
    setLoading(true);
    apiClient
      .get(`/tickets/${id}`)
      .then((res) => setSelected(res.data))
      .catch(() => setMessage("Unable to load ticket"))
      .finally(() => setLoading(false));
  };

  const sendReply = () => {
    if (!reply || !selected) return;
    setLoading(true);
    apiClient
      .post(`/tickets/${selected.id}/reply`, { message: reply })
      .then(() => {
        setReply("");
        openTicket(selected.id);
      })
      .catch(() => setMessage("Failed to reply"))
      .finally(() => setLoading(false));
  };

  const updateStatus = (status) => {
    if (!selected) return;
    setLoading(true);
    apiClient
      .patch(`/tickets/${selected.id}/status`, { status })
      .then(() => openTicket(selected.id))
      .catch(() => setMessage("Failed to update status"))
      .finally(() => setLoading(false));
  };

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />
      <Row className="g-3">
        <Col md={4}>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Header>
              <h5 className="mb-0">New Ticket</h5>
            </Card.Header>
            <Card.Body>
              {message && <Alert variant="info">{message}</Alert>}
              <Form.Group className="mb-2">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  value={newTicket.title}
                  onChange={(e) => setNewTicket((t) => ({ ...t, title: e.target.value }))}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Body</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={newTicket.body}
                  onChange={(e) => setNewTicket((t) => ({ ...t, body: e.target.value }))}
                />
              </Form.Group>
              <Button variant="info" onClick={createTicket}>
                Submit
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Tickets</h5>
              </div>
              <Form.Select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                style={{ maxWidth: 180 }}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Form.Select>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => openTicket(t.id)}>
                        <td>{t.id}</td>
                        <td>{t.title}</td>
                        <td>
                          <Badge bg={t.status === "closed" ? "secondary" : "success"}>{t.status}</Badge>
                        </td>
                        <td>{new Date(t.updated_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-muted text-center">
                          No tickets yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {selected && (
            <Card className="shadow-sm border-0">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Ticket #{selected.id}</h5>
                  <small className="text-muted">{selected.title}</small>
                </div>
                {isSupport && (
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-success" onClick={() => updateStatus("open")}>
                      Open
                    </Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => updateStatus("closed")}>
                      Close
                    </Button>
                  </div>
                )}
              </Card.Header>
              <Card.Body>
                <p>{selected.body}</p>
                <hr />
                <div className="mb-3">
                  {selected.messages?.map((m) => (
                    <div key={m.id} className="mb-2">
                      <div className="small text-muted">
                        User {m.user_id || "?"} · {new Date(m.created_at).toLocaleString()}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  ))}
                  {(!selected.messages || selected.messages.length === 0) && (
                    <div className="text-muted">No replies yet.</div>
                  )}
                </div>
                {isSupport && (
                  <div className="d-flex gap-2">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply..."
                    />
                    <Button variant="info" onClick={sendReply}>
                      Reply
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default TicketsPage;
