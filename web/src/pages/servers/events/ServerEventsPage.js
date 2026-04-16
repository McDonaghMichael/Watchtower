import React, { useEffect, useState } from "react";
import { Container, Button, Card, Row, Col, Badge } from "react-bootstrap";
import apiClient from "../../../api/client";
import { useNavigate, useParams } from "react-router-dom";

const operatorLabel = {
  "<": "less than", ">": "more than", "=": "equal to", "!=": "not equal to",
  less_than: "less than", more_than: "more than", equal_to: "equal to", not_equal_to: "not equal to",
};

const metricLabel = {
  cpu_usage: "CPU (%)", memory_allocated: "Memory Allocated", memory_allocations: "Memory Allocations",
  memory_usage: "Memory (%)", swap_used: "Swap Used", swap_total: "Swap Total", swap_free: "Swap Free",
  cache_memory: "Cache Memory", buffer_memory: "Buffer Memory", disk_usage_total: "Disk Total",
  disk_usage_used: "Disk Used", disk_usage_free: "Disk Free", disk_usage: "Disk Usage (%)",
  ssh_connections: "SSH Connections", http_connections: "HTTP Connections",
  https_connections: "HTTPS Connections", connections: "Connections", uptime_seconds: "Uptime (s)",
};

const actionColors = {
  webhook: "#3b82f6", slack_webhook: "#8b5cf6", discord_webhook: "#6366f1",
  exec_command: "#f59e0b", reboot: "#ef4444",
};

function formatCondition(cond) {
  const metric = metricLabel[cond.metric] || cond.metric;
  const op = operatorLabel[cond.operator] || cond.operator;
  return `${metric} ${op} ${cond.value}`;
}

function SummaryCard({ label, value, description }) {
  return (
    <Card className="h-100 border-0 shadow-sm" style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
      <Card.Body className="p-4">
        <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)", lineHeight: 1, marginBottom: 6 }}>
          {value}
        </div>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{description}</div>
      </Card.Body>
    </Card>
  );
}

function GroupCard({ group, onEdit }) {
  return (
    <Card className="h-100 border-0 shadow-sm" style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
      <Card.Header
        className="d-flex justify-content-between align-items-center"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", borderRadius: "12px 12px 0 0", padding: "0.85rem 1.1rem" }}
      >
        <div>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>Group #{group.group_id}</span>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>
            {group.conditions?.length || 0} condition{group.conditions?.length !== 1 ? "s" : ""} ·{" "}
            {group.actions?.length || 0} action{group.actions?.length !== 1 ? "s" : ""}
          </div>
        </div>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={onEdit}
          style={{ fontSize: "0.78rem", borderRadius: 8 }}
        >
          Edit
        </Button>
      </Card.Header>

      <Card.Body className="p-3">
        <div className="mb-3">
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Conditions
          </div>
          {group.conditions?.length > 0 ? (
            <div className="d-flex flex-column gap-2">
              {group.conditions.map((cond, i) => (
                <div key={cond.condition_id || i}>
                  {i > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", margin: "4px 0", paddingLeft: 8 }}>
                      {cond.connector || "AND"}
                    </div>
                  )}
                  <div
                    style={{
                      background: "rgba(16,163,127,0.06)",
                      border: "1px solid rgba(16,163,127,0.15)",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: "0.82rem",
                      color: "var(--text)",
                    }}
                  >
                    <span style={{ color: "var(--muted)", marginRight: 4 }}>#{cond.condition_id || i + 1}</span>
                    {formatCondition(cond)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No conditions.</span>
          )}
        </div>

        <div>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Actions
          </div>
          {group.actions?.length > 0 ? (
            <div className="d-flex flex-wrap gap-2">
              {group.actions.map((act) => (
                <span
                  key={act.action_id}
                  style={{
                    background: `${actionColors[act.action] || "#6b7280"}18`,
                    border: `1px solid ${actionColors[act.action] || "#6b7280"}40`,
                    color: actionColors[act.action] || "var(--muted)",
                    borderRadius: 6,
                    padding: "3px 9px",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                  }}
                >
                  {act.action.replace(/_/g, " ")}
                  {act.value ? ` → ${act.value.length > 24 ? act.value.slice(0, 24) + "…" : act.value}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: "0.82rem", color: "var(--muted)" }}>No actions.</span>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

function ServerEventsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await apiClient.get(`/group/server/${id}`);
        const withData = await Promise.all(
          res.data.map(async (group) => {
            const [cRes, aRes] = await Promise.all([
              apiClient.get(`/condition/group/${group.group_id}`),
              apiClient.get(`/action/group/${group.group_id}`),
            ]);
            return { ...group, conditions: cRes.data, actions: aRes.data };
          })
        );
        setGroups(withData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, [id]);

  const totalConditions = groups.reduce((s, g) => s + (g.conditions?.length || 0), 0);
  const totalActions = groups.reduce((s, g) => s + (g.actions?.length || 0), 0);

  return (
    <Container fluid className="w-75 py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h4 className="mb-1 fw-semibold" style={{ color: "var(--text)" }}>Server Events</h4>
          <p className="mb-0" style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
            Alert groups with conditions and the actions they trigger.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(`/server/${id}`)}
            style={{ borderRadius: 8 }}
          >
            ← Back
          </Button>
          <Button
            variant="info"
            size="sm"
            className="text-white"
            onClick={() => navigate(`/server/events/${id}/create`)}
            style={{ borderRadius: 8 }}
          >
            + Create Event
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <SummaryCard label="Groups" value={groups.length} description="Alert groups configured for this server." />
        </Col>
        <Col md={4}>
          <SummaryCard label="Conditions" value={totalConditions} description="Active checks that trigger actions." />
        </Col>
        <Col md={4}>
          <SummaryCard label="Actions" value={totalActions} description="Responses when conditions are met." />
        </Col>
      </Row>

      {/* Group Cards */}
      {groups.length === 0 ? (
        <Card className="border-0 shadow-sm" style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <Card.Body className="py-5 text-center">
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>◎</div>
            <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>No event groups yet</div>
            <div style={{ color: "var(--muted)", fontSize: "0.88rem", marginBottom: 16 }}>
              Create your first event to start monitoring this server.
            </div>
            <Button
              variant="info"
              size="sm"
              className="text-white"
              onClick={() => navigate(`/server/events/${id}/create`)}
              style={{ borderRadius: 8 }}
            >
              + Create Event
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {groups.map((group) => (
            <Col md={6} key={group.group_id}>
              <GroupCard
                group={group}
                onEdit={() => navigate(`/server/events/${id}/edit/${group.group_id}`)}
              />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default ServerEventsPage;
