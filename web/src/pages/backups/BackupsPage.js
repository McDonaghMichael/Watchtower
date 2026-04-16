import { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col, Alert, Table } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";

function BackupsPage() {
  const [config, setConfig] = useState({ enabled: false, interval_ms: 86400000, backup_location: "./backups" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", variant: "info" });
  const [backups, setBackups] = useState([]);

  const showMsg = (text, variant = "info") => setMessage({ text, variant });

  const refreshList = () => {
    apiClient
      .get("/backups")
      .then((res) => setBackups(res.data || []))
      .catch(() => setBackups([]));
  };

  const loadConfig = () => {
    apiClient
      .get("/backups/config")
      .then((res) => setConfig(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadConfig();
    refreshList();
  }, []);

  const handleSaveConfig = () => {
    setLoading(true);
    setMessage({ text: "", variant: "info" });
    apiClient
      .post("/backups/schedule", {
        enabled: config.enabled,
        interval_ms: Number(config.interval_ms) || 86400000,
        backup_location: config.backup_location || "./backups",
      })
      .then(() => showMsg("Configuration saved.", "success"))
      .catch(() => showMsg("Failed to save configuration.", "danger"))
      .finally(() => setLoading(false));
  };

  const handleManualBackup = () => {
    setLoading(true);
    setMessage({ text: "", variant: "info" });
    apiClient
      .post("/backups/create")
      .then((res) => {
        showMsg(`Backup created: ${res.data.filename}`, "success");
        refreshList();
      })
      .catch((err) => showMsg(err?.response?.data?.error || "Backup failed.", "danger"))
      .finally(() => setLoading(false));
  };

  const handleDownload = (id, filename) => {
    const zipName = filename.replace(/\.sql$/, ".zip");
    apiClient
      .get(`/backups/download/${id}`, { responseType: "blob" })
      .then((res) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(res.data);
        link.download = zipName;
        link.click();
      })
      .catch(() => showMsg("Download failed.", "danger"));
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this backup?")) return;
    apiClient
      .delete(`/backups/${id}`)
      .then(() => refreshList())
      .catch(() => showMsg("Failed to delete backup.", "danger"));
  };

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />

      {message.text && (
        <Alert variant={message.variant} dismissible onClose={() => setMessage({ text: "", variant: "info" })}>
          {message.text}
        </Alert>
      )}

      <Row className="g-4 mb-4">
        {/* Backup Configuration */}
        <Col md={8}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header>
              <h5 className="mb-0">Backup Configuration</h5>
              <small className="text-muted">Automatic backup schedule and storage location</small>
            </Card.Header>
            <Card.Body>
              <Form.Check
                type="switch"
                id="backup-enabled"
                label="Enable automatic backups"
                className="mb-3"
                checked={config.enabled}
                onChange={(e) => setConfig((s) => ({ ...s, enabled: e.target.checked }))}
              />
              <Form.Group className="mb-3">
                <Form.Label>Interval (milliseconds)</Form.Label>
                <Form.Control
                  type="number"
                  min={1000}
                  placeholder="e.g. 86400000 for 24 hours"
                  value={config.interval_ms}
                  onChange={(e) => setConfig((s) => ({ ...s, interval_ms: e.target.value }))}
                />
                <Form.Text className="text-muted">
                  {config.interval_ms > 0
                    ? `≈ ${(Number(config.interval_ms) / 3600000).toFixed(2)} hour(s)`
                    : ""}
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Backup location (server path)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="./backups"
                  value={config.backup_location}
                  onChange={(e) => setConfig((s) => ({ ...s, backup_location: e.target.value }))}
                />
              </Form.Group>
              <Button variant="primary" onClick={handleSaveConfig}>
                Save Configuration
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Manual Backup */}
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Header>
              <h5 className="mb-0">Manual Backup</h5>
              <small className="text-muted">Create a backup now</small>
            </Card.Header>
            <Card.Body className="d-flex flex-column justify-content-between">
              <p className="text-muted">
                Triggers a full pg_dump of the current database state and stores it in the configured backup location.
              </p>
              <Button variant="info" onClick={handleManualBackup}>
                Create Backup Now
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Backup List */}
      <Card className="shadow-sm border-0">
        <Card.Header>
          <h5 className="mb-0">Stored Backups</h5>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.filename}</td>
                    <td>{b.size_human || `${b.size_bytes} B`}</td>
                    <td>{new Date(b.created_at).toLocaleString()}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-info"
                        className="me-2"
                        onClick={() => handleDownload(b.id, b.filename)}
                      >
                        Download .zip
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(b.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted text-center">
                      No backups yet.
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

export default BackupsPage;
