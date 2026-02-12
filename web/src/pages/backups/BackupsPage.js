import { useEffect, useState } from "react";
import { Container, Card, Button, Form, Row, Col, Alert, Table } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";

function BackupsPage() {
  const [tables, setTables] = useState("");
  const [schedule, setSchedule] = useState({ enabled: false, interval_minutes: 1440 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [backups, setBackups] = useState([]);

  const triggerDownload = (url, filename) => {
    apiClient
      .get(url, { responseType: "blob" })
      .then((res) => {
        const blob = res.data;
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      })
      .catch(() => setMessage("Download failed"));
  };

  const handleFullBackup = () => {
    setMessage("");
    triggerDownload("/backups/full", "backup.sql");
    refreshList();
  };

  const handleTableBackup = () => {
    setLoading(true);
    setMessage("");
    const list = tables
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    apiClient
      .post("/backups/tables", { tables: list }, { responseType: "blob" })
      .then((res) => {
        const blob = res.data;
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = "tables.sql";
        link.click();
      })
      .catch(() => setMessage("Table export failed"))
      .finally(() => setLoading(false));
    refreshList();
  };

  const handleSchedule = () => {
    setLoading(true);
    setMessage("");
    apiClient
      .post("/backups/schedule", {
        enabled: schedule.enabled,
        interval_minutes: Number(schedule.interval_minutes || 1440),
      })
      .then(() => setMessage("Schedule updated"))
      .catch(() => setMessage("Failed to update schedule"))
      .finally(() => setLoading(false));
  };

  const refreshList = () => {
    apiClient
      .get("/backups")
      .then((res) => setBackups(res.data || []))
      .catch(() => setBackups([]));
  };

  useEffect(refreshList, []);

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header>
          <h4 className="mb-0">Backups</h4>
          <small className="text-muted">Manual and scheduled database backups</small>
        </Card.Header>
        <Card.Body>
          {message && <Alert variant="info">{message}</Alert>}
          <Row className="g-3">
            <Col md={4}>
              <Card className="h-100 border-0">
                <Card.Body>
                  <h5>Full Backup</h5>
                  <p className="text-muted">Download entire database as SQL.</p>
                  <Button variant="info" onClick={handleFullBackup}>
                    Download Full Backup
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0">
                <Card.Body>
                  <h5>Export Tables</h5>
                  <p className="text-muted">Enter tables (comma separated) to export.</p>
                  <Form.Control
                    placeholder="tables, separated, by comma"
                    value={tables}
                    onChange={(e) => setTables(e.target.value)}
                    className="mb-2"
                  />
                  <Button variant="info" onClick={handleTableBackup}>
                    Export Selected Tables
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="h-100 border-0">
                <Card.Body>
                  <h5>Automatic Backups</h5>
                  <p className="text-muted">Enable recurring backups using an interval in minutes.</p>
                  <Form.Check
                    type="switch"
                    id="backup-enabled"
                    label="Enable automatic backups"
                    className="mb-2"
                    checked={schedule.enabled}
                    onChange={(e) => setSchedule((s) => ({ ...s, enabled: e.target.checked }))}
                  />
                  <Form.Control
                    type="number"
                    min={10}
                    placeholder="Interval minutes (e.g., 1440)"
                    value={schedule.interval_minutes}
                    onChange={(e) =>
                      setSchedule((s) => ({ ...s, interval_minutes: e.target.value }))
                    }
                    className="mb-2"
                  />
                  <Button variant="info" onClick={handleSchedule}>
                    Save Schedule
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card className="shadow-sm border-0">
        <Card.Header>
          <h5 className="mb-0">Available Backups</h5>
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
                    <td>
                      <Button
                        size="sm"
                        variant="outline-info"
                        onClick={() =>
                          triggerDownload(`/backups/download/${b.id}`, b.filename)
                        }
                      >
                        Download
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
