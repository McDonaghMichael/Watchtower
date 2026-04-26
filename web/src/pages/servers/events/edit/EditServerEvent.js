import React, { useEffect, useState } from "react";
import { Container, Form, Card, InputGroup, Button, Row, Col } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../../../api/client";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DisplayCard from "../../../../components/notices/DisplayCard";

const valueTypes = {
  webhook: "URL",
  slack_webhook: "URL",
  discord_webhook: "URL",
  exec_command: "CMD",
};

const newConditionTemplate = {
  metric: "cpu_usage",
  operation: "more_than",
  value: 20,
  connector: "AND",
};

const sectionStyle = {
  background: "rgba(16,163,127,0.04)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "1rem",
  marginBottom: "0.75rem",
};

const labelStyle = {
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 4,
};

function EditServerEvent() {
  const { id, group_id } = useParams();
  const navigate = useNavigate();

  const [actions, setActions] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [notice, setNotice] = useState({ show: false, status: "info", title: "", message: "" });

  useEffect(() => {
    const symbolToOperation = { "<": "less_than", ">": "more_than", "=": "equal_to", "!=": "not_equal_to" };

    if (id) {
      apiClient.get(`/condition/group/${group_id}`).then((res) => {
        if (res.data) {
          setConditions(res.data.map((cond) => ({ ...cond, operation: symbolToOperation[cond.operator] || cond.operator, connector: "AND" })));
        }
      }).catch(console.error);

      apiClient.get(`/action/group/${group_id}`).then((res) => {
        setActions(res.data.map((a) => {
          if (a.action === "discord_webhook" && a.value?.includes("|||")) {
            const [url, msg] = a.value.split("|||", 2);
            return { ...a, value: url, message: msg };
          }
          return a;
        }));
      }).catch(console.error);
    }
  }, [id, group_id]);

  const addAction = (e) => {
    e.preventDefault();
    setActions((prev) => [...prev, { action: "webhook", value: "" }]);
  };

  const removeAction = (index) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeAction = (index, field, value) => {
    setActions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConnectorChange = (index, connector) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], connector };
      return updated;
    });
  };

  const handleChange = (index, field, value) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCondition = (e) => {
    e.preventDefault();
    setConditions((prev) => [...prev, { ...newConditionTemplate }]);
  };

  const removeCondition = (conditionId, index) => {
    setConditions((prev) => {
      if (conditionId) return prev.map((c) => (c.condition_id === conditionId ? { ...c, delete: true } : c));
      return prev.filter((_, i) => i !== index);
    });
  };

  const submitData = async (e) => {
    e.preventDefault();
    const operatorMap = { less_than: "<", more_than: ">", equal_to: "=", not_equal_to: "!=" };

    const payload = conditions.map((cond) => ({
      condition_id: cond.condition_id || null,
      group_id: Number(group_id),
      metric: cond.metric,
      operator: operatorMap[cond.operation],
      value: parseInt(cond.value, 10),
      delete: cond.delete || false,
      connector: cond.connector || "AND",
    }));

    const newpayload = actions.map((cond) => ({
      action_id: cond.action_id || null,
      group_id: Number(group_id),
      action: cond.action,
      value: cond.action === "discord_webhook" && cond.message?.trim()
        ? `${cond.value}|||${cond.message.trim()}`
        : cond.value,
      delete: cond.delete || false,
    }));

    try {
      await apiClient.put(`/condition/server/${id}`, payload);
      await apiClient.put(`/action/server/${id}`, newpayload);
      setNotice({ show: true, status: "success", title: "Event updated", message: "Conditions and actions were saved successfully." });
    } catch (err) {
      setNotice({
        show: true,
        status: "error",
        title: "Save failed",
        message: err?.response?.data?.error || "We could not save this event. Please try again.",
      });
    }
  };

  return (
    <Container className="py-4 w-75">
      <Card className="border-0 shadow-sm" style={{ background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)" }}>
        <Card.Header
          className="d-flex justify-content-between align-items-center"
          style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", borderRadius: "14px 14px 0 0", padding: "1.1rem 1.5rem" }}
        >
          <div>
            <h4 className="mb-0 fw-semibold" style={{ color: "var(--text)" }}>Edit Server Event</h4>
            <small style={{ color: "var(--muted)" }}>Update actions and chained conditions.</small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/server/events/${id}`)} style={{ borderRadius: 8 }}>
              ← Back
            </Button>
            <Button variant="outline-info" size="sm" onClick={addCondition} style={{ borderRadius: 8 }}>
              <AddBoxIcon fontSize="small" className="me-1" /> Add Condition
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          <Form>
            {/* Actions Section */}
            <section className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>Actions</div>
                  <small style={{ color: "var(--muted)" }}>Actions executed when the rule matches.</small>
                </div>
                <Button variant="outline-info" size="sm" onClick={addAction} style={{ borderRadius: 8 }}>
                  <AddBoxIcon fontSize="small" className="me-1" /> Add Action
                </Button>
              </div>

              {actions.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "0.75rem 1rem", background: "var(--bg)", borderRadius: 8, border: "1px dashed var(--border)" }}>
                  No actions yet. Add one above.
                </div>
              )}

              {actions.map((action, index) => (
                <div key={`action-${index}`} style={sectionStyle}>
                  <Row className="align-items-end g-3">
                    <Col md={action.action === "reboot" ? 8 : 4}>
                      <Form.Group className="mb-0">
                        <Form.Label style={labelStyle}>Action</Form.Label>
                        <Form.Select
                          value={action.action}
                          onChange={(e) => handleChangeAction(index, "action", e.target.value)}
                          style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8 }}
                        >
                          <option value="webhook">Custom Webhook</option>
                          <option value="slack_webhook">Slack Webhook</option>
                          <option value="discord_webhook">Discord Webhook</option>
                          <option value="reboot">Reboot Server</option>
                          <option value="exec_command">Execute Command</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    {action.action !== "reboot" && (
                      <Col md={6}>
                        <Form.Group className="mb-0">
                          <Form.Label style={labelStyle}>{valueTypes[action.action] || "Value"}</Form.Label>
                          <InputGroup>
                            <InputGroup.Text style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                              {valueTypes[action.action] || "Value"}
                            </InputGroup.Text>
                            <Form.Control
                              value={action.value}
                              onChange={(e) => handleChangeAction(index, "value", e.target.value)}
                              placeholder={`Enter ${valueTypes[action.action] || "value"}`}
                              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
                            />
                            <Button variant="outline-danger" onClick={() => removeAction(index)}>
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    )}
                    {action.action === "discord_webhook" && (
                      <Col md={12}>
                        <Form.Group className="mt-1 mb-0">
                          <Form.Label style={labelStyle}>Custom Message <span style={{ fontWeight: 400 }}>(optional — leave blank for default server details)</span></Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={action.message || ""}
                            onChange={(e) => handleChangeAction(index, "message", e.target.value)}
                            placeholder="e.g. CPU spike detected, please investigate immediately"
                            style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, resize: "none" }}
                          />
                        </Form.Group>
                      </Col>
                    )}

                    {action.action === "reboot" && (
                      <Col md={2}>
                        <Button variant="outline-danger" onClick={() => removeAction(index)} style={{ borderRadius: 8 }}>
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </Col>
                    )}
                  </Row>
                </div>
              ))}
            </section>

            {/* Conditions Section */}
            <section className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <div style={{ fontWeight: 600, color: "var(--text)" }}>Conditions</div>
                  <small style={{ color: "var(--muted)" }}>Connect conditions with AND / OR logic.</small>
                </div>
                <Button variant="outline-info" size="sm" onClick={addCondition} style={{ borderRadius: 8 }}>
                  <AddBoxIcon fontSize="small" className="me-1" /> Add Condition
                </Button>
              </div>

              {conditions.filter((c) => !c.delete).length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "0.75rem 1rem", background: "var(--bg)", borderRadius: 8, border: "1px dashed var(--border)" }}>
                  No conditions yet. Add one above.
                </div>
              )}

              {conditions
                .filter((c) => !c.delete)
                .map((c, index) => (
                  <React.Fragment key={`condition-${index}`}>
                    {index > 0 && (
                      <div className="d-flex align-items-center justify-content-center mb-2">
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem", marginRight: 8 }}>Join with</span>
                        <div className="btn-group">
                          <Button size="sm" variant={c.connector === "AND" ? "info" : "outline-info"} onClick={() => handleConnectorChange(index, "AND")}>AND</Button>
                          <Button size="sm" variant={c.connector === "OR" ? "info" : "outline-info"} onClick={() => handleConnectorChange(index, "OR")}>OR</Button>
                        </div>
                      </div>
                    )}
                    <div style={sectionStyle}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Condition {index + 1}
                        </span>
                        <Button variant="outline-danger" size="sm" onClick={() => removeCondition(c.condition_id, index)} style={{ borderRadius: 6, padding: "2px 8px" }}>
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </div>
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Group className="mb-0">
                            <Form.Label style={labelStyle}>Metric</Form.Label>
                            <Form.Select
                              value={c.metric}
                              onChange={(e) => handleChange(index, "metric", e.target.value)}
                              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8 }}
                            >
                              <option value="cpu_usage">CPU (%)</option>
                              <option value="memory_allocated">Memory Allocated</option>
                              <option value="memory_allocations">Memory Allocations</option>
                              <option value="memory_usage">Memory (%)</option>
                              <option value="swap_used">Swap Used</option>
                              <option value="swap_total">Swap Total</option>
                              <option value="swap_free">Swap Free</option>
                              <option value="cache_memory">Cache Memory</option>
                              <option value="buffer_memory">Buffer Memory</option>
                              <option value="disk_usage_total">Disk Total</option>
                              <option value="disk_usage_used">Disk Used</option>
                              <option value="disk_usage_free">Disk Free</option>
                              <option value="disk_usage">Disk Usage (%)</option>
                              <option value="ssh_connections">SSH Connections</option>
                              <option value="http_connections">HTTP Connections</option>
                              <option value="https_connections">HTTPS Connections</option>
                              <option value="connections">Connections</option>
                              <option value="uptime_seconds">Uptime (s)</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-0">
                            <Form.Label style={labelStyle}>Operation</Form.Label>
                            <Form.Select
                              value={c.operation}
                              onChange={(e) => handleChange(index, "operation", e.target.value)}
                              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8 }}
                            >
                              <option value="more_than">More than</option>
                              <option value="less_than">Less than</option>
                              <option value="equal_to">Equal to</option>
                              <option value="not_equal_to">Not Equal to</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-0">
                            <Form.Label style={labelStyle}>Value</Form.Label>
                            <Form.Control
                              value={c.value}
                              onChange={(e) => handleChange(index, "value", e.target.value)}
                              style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8 }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </div>
                  </React.Fragment>
                ))}
            </section>

            <Button variant="info" className="text-white" onClick={submitData} style={{ borderRadius: 8 }}>
              Save Event
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <DisplayCard
        show={notice.show}
        status={notice.status}
        title={notice.title}
        message={notice.message}
        onClose={() => setNotice((prev) => ({ ...prev, show: false }))}
        primaryAction={{ label: "Back to Events", onClick: () => navigate(`/server/events/${id}`) }}
      />
    </Container>
  );
}

export default EditServerEvent;
