import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../../../api/client";
import { getTimestamp } from "../../../utils/timeUtils";
import LoadingSpinner from "../../../components/misc/LoadingSpinner";
import { Col, Row, Card, Button, Form } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import { LineChart } from "@mui/x-charts/LineChart";
import AlertDefaultNotice from "../../../components/notices/AlertDefaultNotice";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { useTheme } from "../../../theme/ThemeProvider";
import ConsoleModal from "../../../components/ConsoleModal";
import "./ServerMetricsPage.css";

const DEFAULT_METRIC = {
  id: 0,
  num_of_cpu: 0,
  cpu_usage: 0,
  memory_usage: 0,
  memory_allocated: 0,
  memory_usage_percent: 0,
  disk_usage_used: 0,
  disk_usage_total: 1,
  swap_used: 0,
  swap_total: 1,
  connections: 0,
  timestamp: new Date().toISOString(),
};

const DEFAULT_HEALTH = {
  id: 0,
  status: false,
  timestamp: new Date().toISOString(),
};

const DEFAULT_RISK = { score: 0 };

function getMetricColor(percent) {
  if (percent < 20) return "#10a37f";
  if (percent < 65) return "#f59e0b";
  return "#ef4444";
}

function fmt(val, decimals = 1) {
  return (Math.round((val || 0) * Math.pow(10, decimals)) / Math.pow(10, decimals));
}

function StatCard({ label, value, color, icon }) {
  return (
    <Card className="stat-card h-100 border-0">
      <Card.Body className="py-3 px-3 d-flex align-items-center gap-3">
        <div className="stat-icon">
          <span style={{ color: color || "var(--accent)", fontSize: "1rem" }}>{icon}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color: color || "var(--text)" }}>
            {value}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

function ServerMetricsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [metrics, setMetrics] = useState([DEFAULT_METRIC]);
  const [health, setHealth] = useState([DEFAULT_HEALTH]);
  const [riskScore, setRiskScore] = useState(DEFAULT_RISK);
  const [searchTerm, setSearchTerm] = useState("");
  const [queryLimit, setQueryLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [server, setServer] = useState(null);

  useEffect(() => {
    apiClient.get(`/server/${id}`).then((res) => setServer(res.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    const fetch = async () => {
      const limit = Math.min(Math.max(queryLimit, 10), 200);
      try {
        const res = await apiClient.get(`/metrics/server/${id}?limit=${limit}`);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        setMetrics(data.length && data[0] ? data : [DEFAULT_METRIC]);
      } catch {
        setMetrics([DEFAULT_METRIC]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [id, queryLimit]);

  useEffect(() => {
    const fetch = async () => {
      const limit = Math.min(Math.max(queryLimit, 10), 200);
      try {
        const res = await apiClient.get(`/health/server/${id}?limit=${limit}`);
        const data = Array.isArray(res.data) ? res.data : [res.data];
        setHealth(data.length && data[0] ? data : [DEFAULT_HEALTH]);
      } catch {
        setHealth([DEFAULT_HEALTH]);
      }
    };
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [id, queryLimit]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/risk/server/${id}`);
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setRiskScore(data || DEFAULT_RISK);
      } catch {
        setRiskScore(DEFAULT_RISK);
      }
    };
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [id]);

  if (loading) return <LoadingSpinner />;

  const currentMetric = metrics[0] || DEFAULT_METRIC;
  const currentHealth = health[0] || DEFAULT_HEALTH;

  const cpuPct = fmt(currentMetric.cpu_usage);
  const memPct = fmt((currentMetric.memory_usage_percent || 0));
  const diskPct = fmt(((currentMetric.disk_usage_used || 0) / (currentMetric.disk_usage_total || 1)) * 100);

  const filteredMetrics = metrics.filter((m) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      String(m.id || "").includes(s) ||
      String(m.cpu_usage || "").includes(s) ||
      String(m.memory_allocated || "").includes(s)
    );
  });

  const chartMetrics = metrics.slice(0, queryLimit).reverse();
  const chartData = {
    xData: chartMetrics.map((_, i) => i + 1),
    cpuUsage: chartMetrics.map((m) => fmt(m?.cpu_usage)),
    memoryUsage: chartMetrics.map((m) => fmt(m?.memory_usage_percent)),
    diskUsage: chartMetrics.map((m) =>
      m?.disk_usage_total ? fmt((m.disk_usage_used / m.disk_usage_total) * 100) : 0
    ),
    swapUsage: chartMetrics.map((m) =>
      m?.swap_total ? fmt((m.swap_used / m.swap_total) * 100) : 0
    ),
    connections: chartMetrics.map((m) => m?.connections || 0),
  };

  const axisColor = isDark ? "#6b7280" : "#9ca3af";
  const axisTextColor = isDark ? "#a1a1a1" : "#6b7280";
  const chartBg = isDark ? "#111111" : "#f9f9f9";

  return (
    <Container className="py-4 w-75">
      <Card className="page-header-card shadow-sm border-0 overflow-hidden">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0 fw-semibold" style={{ color: "var(--text)" }}>Server Metrics</h4>
            <small style={{ color: "var(--muted)" }}>Live telemetry, health, and risk analysis.</small>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/server/events/${id}`)}>
              Events
            </Button>
            <Button variant="info" size="sm" className="text-white" onClick={() => navigate(`/server/events/${id}/create`)}>
              + Create Event
            </Button>
            <Button variant="outline-success" size="sm" onClick={() => setShowConsole(true)}>
              ⌨ Console
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
          {/* Stat Cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={2}>
              <StatCard
                label="Status"
                value={currentHealth.status ? "Online" : "Offline"}
                color={currentHealth.status ? "#10a37f" : "#ef4444"}
                icon={currentHealth.status ? "●" : "○"}
              />
            </Col>
            <Col xs={6} md={2}>
              <StatCard
                label="CPU Usage"
                value={`${cpuPct}%`}
                color={getMetricColor(cpuPct)}
                icon="⚡"
              />
            </Col>
            <Col xs={6} md={2}>
              <StatCard
                label="Memory"
                value={`${memPct}%`}
                color={getMetricColor(memPct)}
                icon="◈"
              />
            </Col>
            <Col xs={6} md={2}>
              <StatCard
                label="Disk"
                value={`${diskPct}%`}
                color={getMetricColor(diskPct)}
                icon="▣"
              />
            </Col>
            <Col xs={6} md={2}>
              <StatCard
                label="Connections"
                value={currentMetric.connections || 0}
                icon="⇌"
              />
            </Col>
            <Col xs={6} md={2}>
              <StatCard
                label="Risk Score"
                value={fmt(riskScore?.score, 2)}
                color={getMetricColor(riskScore?.score || 0)}
                icon="◉"
              />
            </Col>
          </Row>

          {/* Chart */}
          <Card className="chart-card border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h6 className="mb-0 fw-semibold" style={{ color: "var(--text)" }}>Telemetry History</h6>
                  <small style={{ color: "var(--muted)" }}>Last {queryLimit} data points</small>
                </div>
              </div>
              <LineChart
                xAxis={[{
                  data: chartData.xData,
                  tickLabelStyle: { fill: axisTextColor, fontSize: 11 },
                  axisLine: { style: { stroke: axisColor } },
                }]}
                yAxis={[{
                  label: "%",
                  labelStyle: { fill: axisTextColor, fontSize: 11 },
                  tickLabelStyle: { fill: axisTextColor, fontSize: 11 },
                }]}
                series={[
                  { data: chartData.cpuUsage, label: "CPU", color: "#f59e0b", showMark: false },
                  { data: chartData.memoryUsage, label: "Memory", color: "#8b5cf6", showMark: false },
                  { data: chartData.diskUsage, label: "Disk", color: "#ef4444", showMark: false },
                  { data: chartData.swapUsage, label: "Swap", color: "#ec4899", showMark: false },
                  { data: chartData.connections, label: "Connections", color: "#3b82f6", showMark: false },
                ]}
                height={340}
                sx={{
                  width: "100%",
                  backgroundColor: chartBg,
                  borderRadius: "8px",
                  "& .MuiChartsAxis-line": { stroke: axisColor },
                  "& .MuiChartsAxis-tick": { stroke: axisColor },
                  "& .MuiChartsAxis-tickLabel": { fill: axisTextColor },
                  "& .MuiChartsLegend-series text": { fill: `${axisTextColor} !important` },
                  "& .MuiChartsLegend-mark": { rx: 3 },
                }}
              />
            </Card.Body>
          </Card>

          {/* Data Table */}
          <Card className="data-card border-0 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex gap-2 mb-3">
                <Form.Control
                  type="text"
                  placeholder="Search metrics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                  style={{ maxWidth: "280px" }}
                />
                <Form.Control
                  type="number"
                  placeholder="Limit"
                  value={queryLimit}
                  min={10}
                  max={200}
                  onChange={(e) => setQueryLimit(Number(e.target.value))}
                  size="sm"
                  style={{ maxWidth: "100px" }}
                />
              </div>

              <Tabs defaultActiveKey="metrics" className="mb-3 metrics-tabs">
                <Tab eventKey="metrics" title="Metrics">
                  {filteredMetrics.length === 0 ? (
                    <AlertDefaultNotice
                      title="No Metrics"
                      message={`No metrics found${searchTerm ? ` for "${searchTerm}"` : ""}.`}
                    />
                  ) : (
                    <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                      {filteredMetrics.map((metric, index) => (
                        <Card key={metric?.id || index} className="mb-2 border-0 metric-log-card">
                          <Card.Body className="py-2 px-3">
                            <div className="d-flex flex-wrap gap-3 align-items-center" style={{ fontSize: "0.8rem" }}>
                              <span style={{ color: "var(--muted)", minWidth: "170px" }}>
                                {metric?.timestamp || getTimestamp()}
                              </span>
                              <span style={{ color: "var(--muted)" }}>
                                <span style={{ color: "var(--text)", fontWeight: 500 }}>#{metric?.id || "—"}</span>
                              </span>
                              <span>
                                <span style={{ color: "var(--muted)" }}>CPU </span>
                                <span style={{ color: getMetricColor(metric?.cpu_usage || 0), fontWeight: 500 }}>
                                  {fmt(metric?.cpu_usage)}%
                                </span>
                              </span>
                              <span>
                                <span style={{ color: "var(--muted)" }}>Mem </span>
                                <span style={{ color: "#8b5cf6", fontWeight: 500 }}>
                                  {fmt(metric?.memory_usage_percent)}%
                                </span>
                              </span>
                              <span>
                                <span style={{ color: "var(--muted)" }}>Disk </span>
                                <span style={{ color: getMetricColor(diskPct), fontWeight: 500 }}>
                                  {metric?.disk_usage_used != null
                                    ? fmt((metric.disk_usage_used / (metric.disk_usage_total || 1)) * 100)
                                    : "—"}%
                                </span>
                              </span>
                              <span>
                                <span style={{ color: "var(--muted)" }}>Conn </span>
                                <span style={{ color: "#3b82f6", fontWeight: 500 }}>
                                  {metric?.connections || 0}
                                </span>
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Tab>

                <Tab eventKey="health" title="Health">
                  {health.length === 0 ? (
                    <AlertDefaultNotice title="No Health Logs" message="No health data available." />
                  ) : (
                    <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                      {health.map((h, index) => (
                        <Card
                          key={h?.id || index}
                          className={`mb-2 border-0 health-log-card ${h?.status ? "online" : "offline"}`}
                        >
                          <Card.Body className="py-2 px-3">
                            <div className="d-flex flex-wrap gap-3 align-items-center" style={{ fontSize: "0.8rem" }}>
                              <span style={{ color: "var(--muted)", minWidth: "170px" }}>
                                {h?.timestamp || getTimestamp()}
                              </span>
                              <span style={{ color: "var(--muted)" }}>
                                <span style={{ color: "var(--text)", fontWeight: 500 }}>#{h?.id || "—"}</span>
                              </span>
                              <span
                                style={{
                                  color: h?.status ? "#10a37f" : "#ef4444",
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  fontSize: "0.75rem",
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {h?.status ? "● Online" : "○ Offline"}
                              </span>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
      <ConsoleModal
        serverId={id}
        serverName={server?.server_name || `Server ${id}`}
        show={showConsole}
        onClose={() => setShowConsole(false)}
      />
    </Container>
  );
}

export default ServerMetricsPage;
