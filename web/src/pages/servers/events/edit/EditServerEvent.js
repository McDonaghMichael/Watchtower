import React, { useEffect, useState } from "react";
import {
  Container,
  Form,
  Card,
  InputGroup,
  Button,
  Row,
  Col,
} from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import DisplayCard from "../../../../components/notices/DisplayCard";

const API_BASE_URL = process.env.REACT_APP_API_URL;

function EditServerEvent() {
  const { id, group_id } = useParams();
  const navigate = useNavigate();

  const [actions, setActions] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [notice, setNotice] = useState({
    show: false,
    status: "info",
    title: "",
    message: "",
  });

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

  useEffect(() => {
    const symbolToOperation = {
      "<": "less_than",
      ">": "more_than",
      "=": "equal_to",
      "!=": "not_equal_to",
    };

    if (id) {
      axios
        .get(`${API_BASE_URL}/condition/group/${group_id}`)
        .then((res) => {
          console.log("Response data:", res.data);
          if (res.data) {
            const mappedConditions = res.data.map((cond, idx) => ({
              ...cond,
              operation: symbolToOperation[cond.operator] || cond.operator,
              connector: idx === 0 ? "AND" : "AND",
            }));

            setConditions(mappedConditions);
          }
        })
        .catch((err) => {
          console.error("Error fetching server:", err);
        });
      axios
        .get(`${API_BASE_URL}/action/group/${group_id}`)
        .then((res) => {
          console.log("Response actions data:", res.data);

          setActions(res.data);
        })
        .catch((err) => {
          console.error("Error fetching server:", err);
        });
    }
  }, [id]);

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
    setConditions((prev) => [...prev, { ...newConditionTemplate }]);
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

  const handleConnectorChange = (index, connector) => {
    setConditions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], connector };
      return updated;
    });
  };

  const handleChangeAction = (index, field, value) => {
    setActions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      console.log(updated);
      return updated;
    });
  };

  const submitData = async (e) => {
    e.preventDefault();

    const operatorMap = {
      less_than: "<",
      more_than: ">",
      equal_to: "=",
      not_equal_to: "!=",
    };

    // Get the first defined group_id from the array

    const payload = conditions.map((cond) => ({
      condition_id: cond.condition_id || null,
      group_id: Number(group_id),
      metric: cond.metric,
      operator: operatorMap[cond.operation],
      value: parseInt(cond.value, 10),
      delete: cond.delete || false,
      connector: cond.connector || "AND",
    }));

    console.log("Payload sent:", payload);

    const newpayload = actions.map((cond) => ({
      action_id: cond.action_id || null,
      group_id: Number(group_id),
      action: cond.action,
      value: cond.value,
      delete: cond.delete || false,
    }));

    try {
      await axios.put(`${API_BASE_URL}/condition/server/${id}`, payload);
      await axios.put(`${API_BASE_URL}/action/server/${id}`, newpayload);
      setNotice({
        show: true,
        status: "success",
        title: "Event updated",
        message: "Conditions and actions were saved successfully.",
      });
    } catch (err) {
      console.error("Error updating server:", err);
      setNotice({
        show: true,
        status: "error",
        title: "Save failed",
        message:
          err?.response?.data?.error ||
          "We could not save this event. Please try again.",
      });
    }
  };

  return (
    <>
      <Container className="py-4 w-75">
        <Card className="shadow-lg border-0 bg-dark text-light rounded-4 overflow-hidden">
          <Card.Header className="bg-gradient bg-dark text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">Edit Server Event</h4>
              <small className="text-white-50">
                Update actions and chained conditions.
              </small>
            </div>
            <Button variant="outline-light" onClick={addCondition}>
              <AddBoxIcon className="me-1" /> Add Condition
            </Button>
          </Card.Header>
          <Card.Body className="bg-dark">
            <Form>
              <section className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="mb-1 text-light">Actions</h5>
                    <small className="text-secondary">
                      Actions executed when the rule matches.
                    </small>
                  </div>
                  <Button variant="outline-info" onClick={addAction}>
                    <AddBoxIcon className="me-1" /> Add Action
                  </Button>
                </div>

                {actions.map((action, index) => (
                  <Card
                    key={`action-${index}`}
                    className="mb-3 border-0 shadow-sm"
                    bg="dark"
                    text="light"
                  >
                    <Card.Body className="bg-body-secondary bg-opacity-10 rounded-3">
                      <Row className="align-items-end">
                        <Col md={action.action === "reboot" ? 6 : 4}>
                          <Form.Group className="mb-3">
                            <Form.Label className="text-light">Action</Form.Label>
                            <Form.Select
                              aria-label="Action"
                              value={action.action}
                              onChange={(e) =>
                                handleChangeAction(
                                  index,
                                  "action",
                                  e.target.value
                                )
                              }
                            >
                              <option value="webhook">Custom Webhook</option>
                              <option value="slack_webhook">
                                Slack Webhook
                              </option>
                              <option value="discord_webhook">
                                Discord Webhook
                              </option>
                              <option value="reboot">Reboot Server</option>
                              <option value="exec_command">
                                Execute Command
                              </option>
                            </Form.Select>
                          </Form.Group>
                        </Col>

                        {action.action !== "reboot" && (
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label className="text-light">
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
                                    handleChangeAction(
                                      index,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Enter ${
                                    valueTypes[action.action] || "value"
                                  }`}
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
                    <h5 className="mb-1 text-light">Conditions</h5>
                    <small className="text-secondary">
                      Connect conditions with AND / OR logic.
                    </small>
                  </div>
                  <Button variant="outline-info" onClick={addCondition}>
                    <AddBoxIcon className="me-1" /> Add Condition
                  </Button>
                </div>

                {conditions
                  .filter((c) => !c.delete)
                  .map((c, index) => (
                    <React.Fragment key={`condition-${index}`}>
                      {index > 0 && (
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <span className="text-secondary me-2">Join with</span>
                          <div className="btn-group">
                            <Button
                              size="sm"
                              variant={
                                c.connector === "AND"
                                  ? "info"
                                  : "outline-info"
                              }
                              onClick={() =>
                                handleConnectorChange(index, "AND")
                              }
                            >
                              AND
                            </Button>
                            <Button
                              size="sm"
                              variant={
                                c.connector === "OR"
                                  ? "info"
                                  : "outline-info"
                              }
                              onClick={() => handleConnectorChange(index, "OR")}
                            >
                              OR
                            </Button>
                          </div>
                        </div>
                      )}
                      <Card className="mb-3 shadow-sm border-0" bg="dark" text="light">
                        <Card.Body className="bg-body-secondary bg-opacity-10 rounded-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0 text-info">
                              Condition {index + 1}
                            </h6>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                removeCondition(c.condition_id, index)
                              }
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </div>
                          <Row className="g-3">
                            <Col md={4}>
                              <Form.Group className="mb-0">
                                <Form.Label className="text-light">Metric</Form.Label>
                                <Form.Select
                                  onChange={(e) =>
                                    handleChange(
                                      index,
                                      "metric",
                                      e.target.value
                                    )
                                  }
                                  aria-label="metric"
                                  value={c.metric}
                                >
                                  <option value="cpu_usage">CPU (%)</option>
                                  <option value="memory_allocated">
                                    Memory Allocated
                                  </option>
                                  <option value="memory_allocations">
                                    Memory Allocations
                                  </option>
                                  <option value="memory_usage">
                                    Memory (%)
                                  </option>
                                  <option value="swap_used">Swap Used</option>
                                  <option value="swap_total">Swap Total</option>
                                  <option value="swap_free">Swap Free</option>
                                  <option value="cache_memory">
                                    Cache Memory
                                  </option>
                                  <option value="buffer_memory">
                                    Buffer Memory
                                  </option>
                                  <option value="disk_usage_total">
                                    Disk Total
                                  </option>
                                  <option value="disk_usage_used">
                                    Disk Used
                                  </option>
                                  <option value="disk_usage_free">
                                    Disk Free
                                  </option>
                                  <option value="disk_usage">
                                    Disk Usage (%)
                                  </option>
                                  <option value="ssh_connections">
                                    SSH Connections
                                  </option>
                                  <option value="http_connections">
                                    HTTP Connections
                                  </option>
                                  <option value="https_connections">
                                    HTTPS Connections
                                  </option>
                                  <option value="connections">
                                    Connections
                                  </option>
                                  <option value="uptime_seconds">
                                    Uptime (s)
                                  </option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-0">
                                <Form.Label className="text-light">Operation</Form.Label>
                                <Form.Select
                                  onChange={(e) =>
                                    handleChange(
                                      index,
                                      "operation",
                                      e.target.value
                                    )
                                  }
                                  aria-label="operation"
                                  value={c.operation}
                                >
                                  <option value="more_than">More than</option>
                                  <option value="less_than">Less than</option>
                                  <option value="equal_to">Equal to</option>
                                  <option value="not_equal_to">
                                    Not Equal to
                                  </option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-0">
                                <Form.Label className="text-light">Value</Form.Label>
                                <InputGroup>
                                  <Form.Control
                                    onChange={(e) =>
                                      handleChange(
                                        index,
                                        "value",
                                        e.target.value
                                      )
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

              <Button variant={"info"} onClick={(e) => submitData(e)}>
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
          primaryAction={{
            label: "Back to Events",
            onClick: () => navigate(`/server/events/${id}`),
          }}
        />
      </Container>
    </>
  );
}

export default EditServerEvent;
