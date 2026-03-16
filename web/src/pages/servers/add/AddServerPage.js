import React, { useState } from "react";
import { Container, Form, Card, Button, Row, Col, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../api/client";
import InstallProgressModal from "../../../components/InstallProgressModal";
import DisplayCard from "../../../components/notices/DisplayCard";

function AddServerPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    server_name: "",
    ip_address: "",
    ssh_username: "",
    ssh_private_key: "",
    ssh_port: 22,
    location: "",
    description: "",
    operating_system: "",
    environment: "production",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [progressServer, setProgressServer] = useState(null); // { id, name }
  const [notice, setNotice] = useState({ show: false, status: "info", title: "", message: "" });

  const environments = ["production", "staging", "development", "testing"];
  const operatingSystems = ["Ubuntu", "CentOS", "Debian", "RedHat", "Windows Server", "Other"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      ...formData,
      ssh_port: parseInt(formData.ssh_port, 10) || 22,
    };

    try {
      // 1. Save the server to the database.
      const res = await apiClient.post("/server", payload);
      const server = res.data;

      // 2. Trigger agent installation (returns 202, runs in background).
      await apiClient.post(`/server/${server.id}/install`, { update: false });

      // 3. Show the live progress modal.
      setProgressServer({ id: server.id, name: server.server_name });
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add server.";
      setError(msg);
      setNotice({ show: true, status: "error", title: "Failed to add server", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Container className="py-4 w-75">
        <Card className="shadow-lg border-0 bg-dark text-light rounded-4 overflow-hidden">
          <Card.Header className="bg-dark d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">Add New Server</h4>
              <small className="text-white-50">
                Fill in the details — the agent will be installed automatically.
              </small>
            </div>
            <Button variant="outline-light" size="sm" onClick={() => navigate("/servers")}>
              Back
            </Button>
          </Card.Header>

          <Card.Body className="bg-dark">
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
                <h5 className="mb-3 text-light">Basic Information</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Server Name</Form.Label>
                      <Form.Control
                        required
                        name="server_name"
                        value={formData.server_name}
                        onChange={handleInputChange}
                        placeholder="e.g., prod-web-01"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">IP Address</Form.Label>
                      <Form.Control
                        required
                        name="ip_address"
                        value={formData.ip_address}
                        onChange={handleInputChange}
                        placeholder="e.g., 192.168.1.100"
                        pattern="^(\d{1,3}\.){3}\d{1,3}$"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* SSH */}
              <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
                <h5 className="mb-3 text-light">SSH Connection</h5>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="text-light">Username</Form.Label>
                      <Form.Control
                        required
                        name="ssh_username"
                        value={formData.ssh_username}
                        onChange={handleInputChange}
                        placeholder="root"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label className="text-light">Private Key</Form.Label>
                      <Form.Control
                        required
                        as="textarea"
                        rows={6}
                        name="ssh_private_key"
                        value={formData.ssh_private_key}
                        onChange={handleInputChange}
                        placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"}
                        style={{ fontFamily: "monospace", fontSize: 12 }}
                      />
                      <Form.Text className="text-muted">
                        Paste the full key including BEGIN / END lines
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label className="text-light">Port</Form.Label>
                      <Form.Control
                        required
                        type="number"
                        name="ssh_port"
                        value={formData.ssh_port}
                        onChange={handleInputChange}
                        min={1}
                        max={65535}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              {/* Server Details */}
              <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
                <h5 className="mb-3 text-light">Server Details</h5>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Operating System</Form.Label>
                      <Form.Select
                        required
                        name="operating_system"
                        value={formData.operating_system}
                        onChange={handleInputChange}
                      >
                        <option value="">Select OS</option>
                        {operatingSystems.map((os) => (
                          <option key={os} value={os}>{os}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Environment</Form.Label>
                      <Form.Select
                        name="environment"
                        value={formData.environment}
                        onChange={handleInputChange}
                      >
                        {environments.map((env) => (
                          <option key={env} value={env}>
                            {env.charAt(0).toUpperCase() + env.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Location</Form.Label>
                      <Form.Control
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., US-East"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="text-light">Description</Form.Label>
                      <Form.Control
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Optional notes"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>

              <div className="d-flex gap-2">
                <Button type="submit" variant="info" disabled={saving}>
                  {saving ? "Saving…" : "Add Server & Install Agent"}
                </Button>
                <Button variant="outline-light" onClick={() => navigate("/servers")}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>

      <InstallProgressModal
        serverId={progressServer?.id}
        serverName={progressServer?.name}
        show={Boolean(progressServer)}
        onClose={() => {
          setProgressServer(null);
          navigate("/servers");
        }}
      />
      <DisplayCard
        show={notice.show}
        status={notice.status}
        title={notice.title}
        message={notice.message}
        onClose={() => setNotice((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}

export default AddServerPage;
