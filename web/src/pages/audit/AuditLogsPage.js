import { useEffect, useState } from "react";
import { Container, Card, Form, Row, Col, Button, Table, Badge } from "react-bootstrap";
import apiClient from "../../api/client";
import LoadingOverlay from "../../components/LoadingOverlay";

function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    user_id: "",
    resource: "",
    resource_id: "",
    since: "",
    until: "",
    limit: 100,
  });

  const load = () => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null) params[k] = v;
    });
    apiClient
      .get("/audit-logs", { params })
      .then((res) => setLogs(res.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  // initial load once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Audit Logs</h4>
            <small className="text-muted">Track actions across the platform</small>
          </div>
          <Button variant="info" onClick={load}>
            Refresh
          </Button>
        </Card.Header>
        <Card.Body>
          <Row className="g-2 mb-3">
            <Col md={3}>
              <Form.Select name="action" value={filters.action} onChange={handleChange}>
                <option value="">Action (any)</option>
                <option value="login">login</option>
                <option value="create_role">create_role</option>
                <option value="update_role">update_role</option>
                <option value="delete_role">delete_role</option>
                <option value="create_server">create_server</option>
                <option value="update_server">update_server</option>
                <option value="delete_server">delete_server</option>
                <option value="delete_account">delete_account</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control placeholder="User ID" name="user_id" value={filters.user_id} onChange={handleChange} />
            </Col>
            <Col md={2}>
              <Form.Control placeholder="Resource" name="resource" value={filters.resource} onChange={handleChange} />
            </Col>
            <Col md={2}>
              <Form.Control placeholder="Resource ID" name="resource_id" value={filters.resource_id} onChange={handleChange} />
            </Col>
            <Col md={3}>
              <Form.Control type="number" placeholder="Limit" name="limit" value={filters.limit} onChange={handleChange} />
            </Col>
          </Row>
          <Row className="g-2 mb-3">
            <Col md={3}>
              <Form.Control type="datetime-local" name="since" value={filters.since} onChange={handleChange} />
            </Col>
            <Col md={3}>
              <Form.Control type="datetime-local" name="until" value={filters.until} onChange={handleChange} />
            </Col>
          </Row>
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Resource</th>
                  <th>Metadata</th>
                  <th>IP</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>
                      <Badge bg="info" text="dark">
                        {log.action}
                      </Badge>
                    </td>
                    <td>{log.user_id || "—"}</td>
                    <td>
                      {log.resource} {log.resource_id ? `#${log.resource_id}` : ""}
                    </td>
                    <td>
                      <code className="small text-break">{JSON.stringify(log.metadata)}</code>
                    </td>
                    <td>{log.ip_address}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      <LoadingOverlay show={loading} />
    </Container>
  );
}

export default AuditLogsPage;
