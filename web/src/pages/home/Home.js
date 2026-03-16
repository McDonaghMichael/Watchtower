import { useEffect, useState } from "react";
import { Col, Row, Card, Button, Badge, ProgressBar } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import apiClient from "../../api/client";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../utils/auth";

const envColors = {
  production: "#ef4444",
  staging: "#f59e0b",
  development: "#10a37f",
  testing: "#82b1ff",
};

function StatCard({ label, value, color, subtitle }) {
  return (
    <Card
      className="h-100 border-0 shadow-sm"
      style={{
        background: "var(--card)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
      }}
    >
      <Card.Body className="py-3 px-4">
        <p className="mb-1 small text-uppercase fw-semibold" style={{ color: "var(--muted)", letterSpacing: "0.06em" }}>
          {label}
        </p>
        <h2 className="mb-0 fw-bold" style={{ color }}>
          {value}
        </h2>
        {subtitle && (
          <small style={{ color: "var(--muted)" }}>{subtitle}</small>
        )}
      </Card.Body>
    </Card>
  );
}

function Home() {
  const navigate = useNavigate();
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const perms = user?.role_permissions || [];
  const has = (p) => isAdmin || perms.includes(p);
  const [servers, setServers] = useState([]);
  const [health, setHealth] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [serversRes, healthRes] = await Promise.all([
          apiClient.get("/servers"),
          apiClient.get("/health"),
        ]);
        const healthData = healthRes.data || [];
        setHealth(healthData);
        const healthMap = {};
        healthData.forEach((h) => { healthMap[h.id] = h; });
        const serversWithHealth = (serversRes.data || []).map((s) => ({
          ...s,
          health: healthMap[s.id] || null,
        }));
        setServers(serversWithHealth);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const onlineCount = servers.filter((s) => s.health?.status).length;
  const total = servers.length;
  const offline = Math.max(total - onlineCount, 0);
  const healthPct = total > 0 ? Math.round((onlineCount / total) * 100) : 0;

  const environments = servers.reduce((acc, s) => {
    if (s.environment) acc[s.environment] = (acc[s.environment] || 0) + 1;
    return acc;
  }, {});
  const topEnvs = Object.entries(environments).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentOffline = servers.filter((s) => !s.health?.status).slice(0, 5);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <Container className="mt-4 w-75">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 className="mb-1 fw-bold" style={{ color: "var(--text)" }}>
              {greeting()}, {user?.username || "there"} 👋
            </h2>
            <p style={{ color: "var(--muted)" }} className="mb-0">
              Here's your fleet health overview.
            </p>
          </div>
          <div className="d-flex gap-2">
            {has("manage_servers") && (
              <Button variant="info" onClick={() => navigate("/server/add")}>
                + Add Server
              </Button>
            )}
            <Button variant="outline-secondary" onClick={() => navigate("/servers")}>
              View Servers
            </Button>
          </div>
        </div>

        {/* Stat cards */}
        <Row className="g-3 mb-4">
          <Col md={3}>
            <StatCard label="Total Servers" value={total} color="#82b1ff" subtitle="Tracked in fleet" />
          </Col>
          <Col md={3}>
            <StatCard label="Online" value={onlineCount} color="#7ee787" subtitle="Healthy & reachable" />
          </Col>
          <Col md={3}>
            <StatCard label="Offline" value={offline} color="#ff8a80" subtitle="Unreachable" />
          </Col>
          <Col md={3}>
            <StatCard label="Health Logs" value={health.length} color="#ffd166" subtitle="Total recorded" />
          </Col>
        </Row>

        {/* Fleet health bar */}
        {total > 0 && (
          <Card className="border-0 shadow-sm mb-4" style={{ background: "var(--card)", borderRadius: 12 }}>
            <Card.Body className="py-3 px-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-semibold" style={{ color: "var(--text)" }}>Fleet Health</span>
                <span className="fw-bold" style={{ color: healthPct >= 80 ? "#7ee787" : healthPct >= 50 ? "#ffd166" : "#ff8a80" }}>
                  {healthPct}%
                </span>
              </div>
              <ProgressBar
                now={healthPct}
                style={{ height: 8, borderRadius: 8, background: "var(--border)" }}
                variant={healthPct >= 80 ? "success" : healthPct >= 50 ? "warning" : "danger"}
              />
              <small style={{ color: "var(--muted)" }}>{onlineCount} of {total} servers online</small>
            </Card.Body>
          </Card>
        )}

        <Row className="g-3 mb-4">
          {/* Environments */}
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ background: "var(--card)", borderRadius: 12 }}>
              <Card.Header className="border-0 pb-0" style={{ background: "var(--card)" }}>
                <h5 className="mb-0 fw-semibold" style={{ color: "var(--text)" }}>Environments</h5>
                <small style={{ color: "var(--muted)" }}>Server distribution</small>
              </Card.Header>
              <Card.Body style={{ background: "var(--card)" }}>
                {topEnvs.length === 0 ? (
                  <p className="mb-0" style={{ color: "var(--muted)" }}>No environment data yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {topEnvs.map(([env, count]) => (
                      <div key={env} className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: envColors[env] || "var(--accent)",
                            flexShrink: 0,
                          }}
                        />
                        <span className="text-capitalize flex-grow-1" style={{ color: "var(--text)", fontSize: "0.9rem" }}>{env}</span>
                        <Badge bg="secondary" style={{ minWidth: 28 }}>{count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Offline servers */}
          <Col md={6}>
            <Card className="border-0 shadow-sm h-100" style={{ background: "var(--card)", borderRadius: 12 }}>
              <Card.Header className="border-0 pb-0" style={{ background: "var(--card)" }}>
                <h5 className="mb-0 fw-semibold" style={{ color: "var(--text)" }}>
                  Offline Servers
                  {offline > 0 && (
                    <Badge bg="danger" className="ms-2" style={{ fontSize: "0.7rem" }}>{offline}</Badge>
                  )}
                </h5>
                <small style={{ color: "var(--muted)" }}>Requires attention</small>
              </Card.Header>
              <Card.Body style={{ background: "var(--card)" }}>
                {recentOffline.length === 0 ? (
                  <div className="d-flex align-items-center gap-2">
                    <span style={{ color: "#7ee787", fontSize: "1.2rem" }}>●</span>
                    <span style={{ color: "var(--muted)" }}>All servers are online.</span>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {recentOffline.map((s) => (
                      <div
                        key={s.id}
                        className="d-flex align-items-center justify-content-between"
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: "rgba(239,68,68,0.07)",
                          border: "1px solid rgba(239,68,68,0.18)",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/server/metrics/${s.id}`)}
                      >
                        <div>
                          <span className="fw-semibold" style={{ color: "var(--text)", fontSize: "0.9rem" }}>{s.server_name}</span>
                          <br />
                          <small style={{ color: "var(--muted)" }}>{s.ip_address}</small>
                        </div>
                        <span style={{ color: "#ff8a80", fontSize: "0.75rem", fontWeight: 600 }}>OFFLINE</span>
                      </div>
                    ))}
                    {offline > 5 && (
                      <small style={{ color: "var(--muted)" }}>+{offline - 5} more offline</small>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

      </Container>
    </div>
  );
}

export default Home;
