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
    "webhook": "URL",
    "slack_webhook": "URL",
    "discord_webhook": "URL",
    "exec_command": "CMD"
  }

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

  const removeAction = (actionId) => {
    setActions((prev) =>
      prev.map((c) =>
        c.action_id === actionId ? { ...c, delete: true } : c
      )
    );
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
      {
        metric: "cpu_usage",
        operation: "more_than",
        value: 20,
      },
    ]);
  };

  const removeCondition = (conditionId) => {
    setConditions((prev) =>
      prev.map((c) =>
        c.condition_id === conditionId ? { ...c, delete: true } : c
      )
    );
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
        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Add Server Event</h4>
          </Card.Header>
          <Card.Body>
            <Form>
              <Row className="mb-4">
                      <h4 className="mb-0">Actions</h4>
                      <div className="d-flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={(e) => addAction(e)}
                        >
                          <AddBoxIcon></AddBoxIcon>
                        </Button>
                      </div>
                    </Row>
              {actions
                .filter((c) => !c.delete)
                .map((c, index) => (
                  <>
                    <Row className="mb-4">
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Action</Form.Label>
                          <Form.Select
                            aria-label="Action"
                              value={c.action}

                            onChange={(e) =>
                            handleChangeAction(index, "action", e.target.value)
                          }
                          >
                            <option value="webhook">Custom Webhook</option>
                            <option value="slack_webhook">Slack Webhook</option>
                            <option value="discord_webhook">Discord Webhook</option>
                            <hr/>
                            <option value="reboot">Reboot Server</option>
                            <option value="exec_command">Execute Command</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                     {c.action !== "reboot" && 
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>{valueTypes[c.action] || "N/A"}</Form.Label>
                          <InputGroup className="mb-3">
                            <InputGroup.Text id="value">{valueTypes[c.action] || "N/A"}</InputGroup.Text>
                            <Form.Control
                              id="value"
                              value={c.value}
                              aria-describedby="value"
                              onChange={(e) =>
                                handleChangeAction(
                                  index,
                                  "value",
                                  e.target.value
                                )
                              }
                            />
                            <Button
                              variant="danger"
                              onClick={(e) => removeAction(c.action_id)}
                            >
                              <DeleteIcon />
                            </Button>
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    }
                      
                    </Row>
                    
                  </>
                ))}
                <Row className="mb-4">
                      <h4 className="mb-0">Conditions</h4>
                      <div className="d-flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={(e) => addCondition(e)}
                        >
                          <AddBoxIcon></AddBoxIcon>
                        </Button>
                      </div>
                    </Row>
              {conditions
                .filter((c) => !c.delete)
                .map((c, index) => (
                  <Row className="mb-4">
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Metric</Form.Label>
                        <Form.Select
                          onChange={(e) =>
                            handleChange(index, "metric", e.target.value)
                          }
                          aria-label="metric"
                          defaultValue={"cpu_usage"}
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
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Operation</Form.Label>
                        <Form.Select
                          onChange={(e) =>
                            handleChange(index, "operation", e.target.value)
                          }
                          aria-label="operation"
                          defaultValue={"cpu_usage"}
                          value={c.operation}
                        >
                          <option value="more_than">More than</option>
                          <option value="less_than">Less than</option>
                          <option value="equal_to">Equal to</option>
                          <option value="not_equal_to">Not Equal to</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Value</Form.Label>
                        <InputGroup className="mb-3">
                          <Form.Control
                            onChange={(e) =>
                              handleChange(index, "value", e.target.value)
                            }
                            aria-label="Value"
                            value={c.value}
                          />
                          <Button
                            variant="danger"
                            onClick={(e) => removeCondition(c.condition_id)}
                          >
                            <DeleteIcon />
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                ))}

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
