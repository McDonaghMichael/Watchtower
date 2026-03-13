import { useEffect, useState } from "react";
import { Col, Row, Card, Button, Badge } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import DisplayCard from "../../components/metrics/DisplayCard";
import apiClient from "../../api/client";
import { useNavigate } from "react-router-dom";
import { getUser } from "../../utils/auth";

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
        setServers(serversRes.data || []);
        setHealth(healthRes.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  const onlineCount = servers.filter((s) => s.health?.status).length;
  const total = servers.length;
  const offline = Math.max(total - onlineCount, 0);
  const environments = servers.reduce((acc, s) => {
    if (s.environment) acc[s.environment] = (acc[s.environment] || 0) + 1;
    return acc;
  }, {});
  const topEnvs = Object.entries(environments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div>
      <Container className="mt-4 w-75">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 className="mb-1">Dashboard</h2>
            <p className="text-muted mb-0">
              High-level overview of fleet health, availability, and events.
            </p>
          </div>
          <div className="d-flex gap-2">
            {has("manage_servers") && (
              <Button variant="info" onClick={() => navigate("/server/add")}>
                Add Server
              </Button>
            )}
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/servers")}
            >
              View Servers
            </Button>
          </div>
        </div>

        <Row className="g-3 mb-4">
          <Col md={3}>
            <DisplayCard
              message="Total Servers"
              value={total}
              color="#82b1ff"
            />
          </Col>
          <Col md={3}>
            <DisplayCard message="Online" value={onlineCount} color="#7ee787" />
          </Col>
          <Col md={3}>
            <DisplayCard message="Offline" value={offline} color="#ff8a80" />
          </Col>
          <Col md={3}>
            <DisplayCard
              message="Health Logs"
              value={health.length || 0}
              color="#ffd166"
            />
          </Col>
        </Row>

        <Card className="shadow-sm border-0 mb-4">
          <Card.Header className="border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Environments</h5>
                <small className="text-muted">
                  Top environments by server count
                </small>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {topEnvs.length === 0 && (
              <p className="text-muted mb-0">No environment data yet.</p>
            )}
            <div className="d-flex flex-wrap gap-2">
              {topEnvs.map(([env, count]) => (
                <Badge key={env} bg="info" text="dark">
                  {env} · {count}
                </Badge>
              ))}
            </div>
          </Card.Body>
        </Card>

      </Container>
    </div>
  );
}

export default Home;
