import { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col, Table, Badge, Alert, Modal, Tabs, Tab } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";
import { getUser } from "../../utils/auth";

function TicketsPage() {
  const user = getUser();
  const isSupport = (user?.role_permissions || []).includes("support_manage");
  const [tickets, setTickets] = useState([]);
  const [archivedTickets, setArchivedTickets] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: "", body: "" });
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const [showModal, setShowModal] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      apiClient.get("/tickets", { params: { status: "open" } }),
      apiClient.get("/tickets", { params: { status: "archived" } }),
    ])
      .then(([openRes, archRes]) => {
        setTickets(openRes.data || []);
        setArchivedTickets(archRes.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

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
        setShowModal(false);
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
      .catch((err) => setMessage(err.response?.data?.error || "Failed to reply"))
      .finally(() => setLoading(false));
  };

  const updateStatus = (status) => {
    if (!selected) return;
    setLoading(true);
    apiClient
      .patch(`/tickets/${selected.id}/status`, { status })
      .then(() => {
        openTicket(selected.id);
        load();
      })
      .catch(() => setMessage("Failed to update status"))
      .finally(() => setLoading(false));
  };

  const ticketRow = (t) => (
    <tr key={t.id} style={{ cursor: "pointer" }} onClick={() => openTicket(t.id)}>
      <td>{t.id}</td>
      <td>{t.title}</td>
      <td>
        <Badge bg={t.status === "archived" ? "secondary" : "success"}>{t.status}</Badge>
      </td>
      <td>{new Date(t.updated_at).toLocaleString()}</td>
    </tr>
  );

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>New Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message && <Alert variant="info" onClose={() => setMessage("")} dismissible>{message}</Alert>}
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
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="info" onClick={createTicket}>Submit</Button>
        </Modal.Footer>
      </Modal>

      <Row className="g-3">
        <Col md={selected ? 6 : 12}>
          <Card className="shadow-sm border-0 mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Support Tickets</h5>
              <Button variant="info" size="sm" onClick={() => setShowModal(true)}>+ New Ticket</Button>
            </Card.Header>
            <Card.Body>
              {message && !showModal && <Alert variant="info" onClose={() => setMessage("")} dismissible>{message}</Alert>}
              <Tabs defaultActiveKey="open" className="mb-3">
                <Tab eventKey="open" title="Open">
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
                        {tickets.map(ticketRow)}
                        {tickets.length === 0 && (
                          <tr><td colSpan={4} className="text-muted text-center">No open tickets.</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
                <Tab eventKey="archived" title="Archived">
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
                        {archivedTickets.map(ticketRow)}
                        {archivedTickets.length === 0 && (
                          <tr><td colSpan={4} className="text-muted text-center">No archived tickets.</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        {selected && (
          <Col md={6}>
            <Card className="shadow-sm border-0">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">Ticket #{selected.id}</h5>
                  <small className="text-muted">{selected.title}</small>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  {isSupport && selected.status === "open" && (
                    <Button size="sm" variant="outline-secondary" onClick={() => updateStatus("archived")}>
                      Archive
                    </Button>
                  )}
                  {isSupport && selected.status === "archived" && (
                    <Button size="sm" variant="outline-success" onClick={() => updateStatus("open")}>
                      Reopen
                    </Button>
                  )}
                  <Button size="sm" variant="outline-secondary" onClick={() => setSelected(null)}>✕</Button>
                </div>
              </Card.Header>
              <Card.Body>
                <p>{selected.body}</p>
                <hr />
                <div className="mb-3">
                  {selected.messages?.map((m) => (
                    <div key={m.id} className="mb-2">
                      <div className="small text-muted">
                        {m.first_name && m.last_name
                          ? `${m.first_name} ${m.last_name}`
                          : m.email || `User ${m.user_id || "?"}`} · {new Date(m.created_at).toLocaleString()}
                      </div>
                      <div>{m.message}</div>
                    </div>
                  ))}
                  {(!selected.messages || selected.messages.length === 0) && (
                    <div className="text-muted">No replies yet.</div>
                  )}
                </div>
                {(isSupport || selected?.user_id === user?.id) && (
                  <div className="d-flex gap-2">
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply..."
                    />
                    <Button variant="info" onClick={sendReply}>Reply</Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default TicketsPage;
