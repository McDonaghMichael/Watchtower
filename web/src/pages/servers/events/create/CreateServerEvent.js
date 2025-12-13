import React, { useEffect, useState } from "react";
import {
  Container,
  Form,
  Card,
  InputGroup,
  Button,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";

const API_BASE_URL = process.env.REACT_APP_API_URL;

function CreateServerEvent() {
  const { id } = useParams();

  const [actions, setActions] = useState([]);
  const [conditions, setConditions] = useState([]);

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

  const addAction = (e) => {
    e.preventDefault();
    setActions((prev) => [
      ...prev,
      {
        action: "webhook",
        value: "",
      },
    ]);
  };

  const removeAction = (index) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeAction = (index, field, value) => {
    setActions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      console.log(updated)
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
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const addCondition = (e) => {
    e.preventDefault();
    setConditions((prev) => [
      ...prev,
      { ...newConditionTemplate },
    ]);
  };

  const removeCondition = (conditionId, index) => {
    setConditions((prev) => {
      if (conditionId) {
        return prev.map((c) =>
          c.condition_id === conditionId ? { ...c, delete: true } : c
        );
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const submitData = async (e) => {
    e.preventDefault();

    const response = await axios
      .post(`${API_BASE_URL}/group`, { server_id: Number(id) })
      .then((res) => {
        console.log("Server updated successfully:", res.data);
        console.log("Server updated successfully:", conditions);

        const operatorMap = {
          less_than: "<",
          more_than: ">",
          equal_to: "=",
          not_equal_to: "!="
        };

        const payload = conditions.map((cond) => ({
          condition_id: cond.condition_id || null,
          group_id: res.data.group_id,
          metric: cond.metric,
          operator: operatorMap[cond.operation],
          value: parseInt(cond.value, 10),
          connector: cond.connector || "AND",
        }));

        console.log("Payload sent:", payload);

        axios
          .put(`${API_BASE_URL}/condition/server/${id}`, payload)
          .then((res) => {
            console.log("Server updated successfully:", res.data);
          })
          .catch((err) => {
            console.error("Error updating server:", err);
          });

        console.log("Payload sent:", payload);

        const newpayload = actions.map((cond) => ({
          action_id: cond.action_id || null,
          group_id: res.data.group_id,
          action: cond.action,
          value: cond.value
        }));

        axios
          .put(`${API_BASE_URL}/action/server/${id}`, newpayload)
          .then((res) => {
            console.log("Server updated successfully:", newpayload);
          })
          .catch((err) => {
            console.error("Error updating server:", err);
          });
      })
      .catch((err) => {
        console.error("Error updating server:", err);
      });
  };

  return (
    <>
      <Container className="py-4">
        <Card className="shadow-lg border-0">
          <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">Add Server Event</h4>
              <small className="text-white-50">
                Define actions and the conditions that trigger them.
              </small>
            </div>
            <Button variant="outline-light" onClick={addCondition}>
              <AddBoxIcon className="me-1" /> Quick Add Condition
            </Button>
          </Card.Header>
          <Card.Body className="bg-light">
            <Form>
              <section className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-1">Actions</h5>
                    <small className="text-muted">
                      What should happen when the rule matches.
                    </small>
                  </div>
                  <Button variant="outline-primary" onClick={addAction}>
                    <AddBoxIcon className="me-1" /> Add Action
                  </Button>
                </div>

                {actions.map((action, index) => (
                  <Card key={`action-${index}`} className="mb-3 shadow-sm">
                    <Card.Body>
                      <Row className="align-items-end">
                        <Col md={action.action === "reboot" ? 6 : 4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Action</Form.Label>
                            <Form.Select
                              aria-label="Action"
                              value={action.action}
                              onChange={(e) =>
                                handleChangeAction(index, "action", e.target.value)
                              }
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
                            <Form.Group className="mb-3">
                              <Form.Label>
                                {valueTypes[action.action] || "Value"}
                              </Form.Label>
                              <InputGroup className="mb-3">
                                <InputGroup.Text id="value">
                                  {valueTypes[action.action] || "Value"}
                                </InputGroup.Text>
                                <Form.Control
                                  id="value"
                                  value={action.value}
                                  aria-describedby="value"
                                  onChange={(e) =>
                                    handleChangeAction(index, "value", e.target.value)
                                  }
                                  placeholder={`Enter ${valueTypes[action.action] || "value"}`}
                                />
                                <Button
                                  variant="outline-danger"
                                  onClick={() => removeAction(index)}
                                >
                                  <DeleteIcon />
                                </Button>
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        )}

                        {action.action === "reboot" && (
                          <Col md={2} className="text-end">
                            <Button
                              variant="outline-danger"
                              className="mt-1"
                              onClick={() => removeAction(index)}
                            >
                              <DeleteIcon />
                            </Button>
                          </Col>
                        )}
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </section>

              <section className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-1">Conditions</h5>
                    <small className="text-muted">
                      Chain multiple conditions with AND / OR.
                    </small>
                  </div>
                  <Button variant="outline-primary" onClick={addCondition}>
                    <AddBoxIcon className="me-1" /> Add Condition
                  </Button>
                </div>

                {conditions
                  .filter((c) => !c.delete)
                  .map((c, index) => (
                    <React.Fragment key={`condition-${index}`}>
                      {index > 0 && (
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <span className="text-muted me-2">Join with</span>
                          <div className="btn-group">
                            <Button
                              size="sm"
                              variant={c.connector === "AND" ? "primary" : "outline-primary"}
                              onClick={() => handleConnectorChange(index, "AND")}
                            >
                              AND
                            </Button>
                            <Button
                              size="sm"
                              variant={c.connector === "OR" ? "primary" : "outline-primary"}
                              onClick={() => handleConnectorChange(index, "OR")}
                            >
                              OR
                            </Button>
                          </div>
                        </div>
                      )}
                      <Card className="mb-3 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 text-primary">Condition {index + 1}</h6>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeCondition(c.condition_id, index)}
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </div>
                          <Row className="g-3">
                            <Col md={4}>
                              <Form.Group className="mb-0">
                                <Form.Label>Metric</Form.Label>
                                <Form.Select
                                  onChange={(e) =>
                                    handleChange(index, "metric", e.target.value)
                                  }
                                  aria-label="metric"
                                  value={c.metric}
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
                                <Form.Label>Operation</Form.Label>
                                <Form.Select
                                  onChange={(e) =>
                                    handleChange(index, "operation", e.target.value)
                                  }
                                  aria-label="operation"
                                  value={c.operation}
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
                                <Form.Label>Value</Form.Label>
                                <InputGroup>
                                  <Form.Control
                                    onChange={(e) =>
                                      handleChange(index, "value", e.target.value)
                                    }
                                    aria-label="Value"
                                    value={c.value}
                                  />
                                </InputGroup>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </React.Fragment>
                  ))}
              </section>

              <Button variant={"primary"} onClick={(e) => submitData(e)}>
                Create Event
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
}

export default CreateServerEvent;
