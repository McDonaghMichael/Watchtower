import { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col, Badge, Modal, Alert } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";

function RoleForm({ show, onHide, onSaved, role }) {
  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [administrator, setAdministrator] = useState(role?.administrator || false);
  const [selected, setSelected] = useState(role?.permissions || []);
  const [color, setColor] = useState(role?.color || "#10a37f");
  const [allPerms, setAllPerms] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/auth/permissions").then((res) => setAllPerms(res.data || []));
  }, []);

  useEffect(() => {
    setName(role?.name || "");
    setDescription(role?.description || "");
    setAdministrator(role?.administrator || false);
    setSelected(role?.permissions || []);
    setColor(role?.color || "#10a37f");
  }, [role]);

  const toggle = (key) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const handleSave = () => {
    if (!name) {
      setError("Name is required");
      return;
    }
    const payload = { name, description, administrator, color, permissions: selected };
    const req = role
      ? apiClient.put(`/roles/${role.id}`, payload)
      : apiClient.post("/roles", payload);
    req
      .then(() => {
        onSaved();
        onHide();
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to save role"));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{role ? "Edit Role" : "Create Role"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control value={description} onChange={(e) => setDescription(e.target.value)} />
          </Form.Group>
          <Form.Check
            className="mb-3"
            type="switch"
            id="administrator"
            label="Administrator (inherit all permissions)"
            checked={administrator}
            onChange={(e) => setAdministrator(e.target.checked)}
          />
          <Form.Group className="mb-3">
            <Form.Label>Role Color</Form.Label>
            <div className="d-flex align-items-center gap-2">
              <Form.Control
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: 70 }}
              />
              <Form.Control
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#10a37f"
              />
            </div>
          </Form.Group>
          <Row className="g-2">
            {allPerms.map((p) => (
              <Col md={6} key={p.id}>
                <Form.Check
                  type="checkbox"
                  id={`perm-${p.id}`}
                  label={`${p.key} – ${p.description}`}
                  checked={selected.includes(p.key) || administrator}
                  disabled={administrator}
                  onChange={() => toggle(p.key)}
                />
              </Col>
            ))}
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="info" onClick={handleSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");

  const load = () => {
    setLoading(true);
    apiClient
      .get("/roles")
      .then((res) => {
        setRoles(res.data || []);
        setError("");
      })
      .catch(() => setError("Failed to load roles"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setShow(true);
  };
  const openEdit = (role) => {
    setEditing(role);
    setShow(true);
  };

  const roleBadges = (perms) =>
    perms?.map((p) => (
      <Badge key={p} bg="secondary" className="me-1">
        {p}
      </Badge>
    ));

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />
      <Card className="shadow-sm border-0">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Roles</h4>
            <small className="text-muted">Manage permissions and hierarchy</small>
          </div>
          <Button variant="info" onClick={openNew}>
            + New Role
          </Button>
        </Card.Header>
        <Card.Body>
          {roles.map((r) => (
            <Card key={r.id} className="mb-2 border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      <span
                        className="rounded-circle border"
                        style={{ display: "inline-block", width: 18, height: 18, background: r.color || "#10a37f" }}
                      />
                      {r.name} {r.administrator ? <Badge bg="success">Admin</Badge> : null}
                    </h5>
                    <p className="text-muted mb-1">{r.description}</p>
                    <div>{roleBadges(r.permissions)}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-info" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </Card.Body>
      </Card>
      <RoleForm show={show} onHide={() => setShow(false)} onSaved={load} role={editing} />
    </Container>
  );
}

export default RolesPage;
