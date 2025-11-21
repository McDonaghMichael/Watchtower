import React, { useState, useEffect } from "react";
import { useParams , useNavigate} from "react-router-dom";
import axios from "axios";
import AlertNotice from "../../../components/notices/AlertNotice";
import { getTimestamp } from "../../../utils/timeUtils";
import LoadingSpinner from "../../../components/misc/LoadingSpinner";
import { Col, Row, Card , Button} from "react-bootstrap";
import Container from "react-bootstrap/Container";
import DisplayCard from "../../../components/metrics/DisplayCard";
import { LineChart } from "@mui/x-charts/LineChart";
import AlertDefaultNotice from "../../../components/notices/AlertDefaultNotice";
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

const API_BASE_URL = process.env.REACT_APP_API_URL;

// Default empty metric object
const DEFAULT_METRIC = {
  id: 0,
  num_of_cpu: 0,
  cpu_usage: 0,
  memory_usage: 0,
  memory_allocated: 0,
  memory_usage_percent: 0,
  disk_usage_used: 0,
  disk_usage_total: 1, // Prevent division by zero
  swap_used: 0,
  swap_total: 1, // Prevent division by zero
  connections: 0,
  timestamp: new Date().toISOString()
};

const DEFAULT_HEALTH = {
  id: 0,
  status: false,
  timestamp: new Date().toISOString()
};

function ServerMetricsPage() {
  
  const { id } = useParams();

  var navigate = useNavigate();
  const [metrics, setMetrics] = useState([DEFAULT_METRIC]);
  const [health, setHealth] = useState([DEFAULT_HEALTH]);
  const [searchTerm, setSearchTerm] = useState("");
  const [queryLimit, setQueryLimit] = useState(10);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchMetrics = async () => {
      try {

        if(queryLimit <= 0){
          setQueryLimit(10)
        }
        if(queryLimit > 200){
          setQueryLimit(200)
        }
        const res = await axios.get(
          `${API_BASE_URL}/metrics/server/${id}?limit=${queryLimit}`
        );
        const data = Array.isArray(res.data) ? res.data : [res.data];
        
        // If no metrics returned, use default
        if (data.length === 0 || !data[0]) {
          setMetrics([DEFAULT_METRIC]);
        } else {
          setMetrics(data);
        }
        
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        // On error, use default metrics instead of showing error
        setMetrics([DEFAULT_METRIC]);
        setError({
          status: err.response?.status,
          message: err.message,
        });
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [id, queryLimit]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {

        if(queryLimit <= 0){
          setQueryLimit(10)
        }
        if(queryLimit > 200){
          setQueryLimit(200)
        }
        const res = await axios.get(
          `${API_BASE_URL}/health/server/${id}?limit=${queryLimit}`
        );
        const data = Array.isArray(res.data) ? res.data : [res.data];
        
        // If no health data returned, use default
        if (data.length === 0 || !data[0]) {
          setHealth([DEFAULT_HEALTH]);
        } else {
          setHealth(data);
        }
        
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        // On error, use default health instead of showing error
        setHealth([DEFAULT_HEALTH]);
        setError({
          status: err.response?.status,
          message: err.message,
        });
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [id, queryLimit]);

  if (loading) return <LoadingSpinner />;
  

  const filteredMetrics = metrics.filter((metric) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(metric.id || "").toLowerCase().includes(search) ||
      String(metric.num_of_cpu || "").toLowerCase().includes(search) ||
      String(metric.memory_allocated || "").toLowerCase().includes(search) ||
      String(metric.disk_usage_used || "").toLowerCase().includes(search)
    );
  });

  const latest10Metrics = metrics.slice(0, queryLimit).reverse(); 
  
  const chartData = {
    xData: latest10Metrics.map((m, idx) => idx + 1), 
    connections: latest10Metrics.map((m) => m?.connections || 0),
    cpuUsage: latest10Metrics.map((m) => parseFloat(m?.cpu_usage) || 0),
    memoryUsage: latest10Metrics.map((m) => parseFloat(m?.memory_usage_percent) || 0),
    diskUsage: latest10Metrics.map((m) => 
      m?.disk_usage_total ? Math.round((m.disk_usage_used / m.disk_usage_total) * 100) : 0
    ),
    swapUsage: latest10Metrics.map((m) => 
      m?.swap_total ? Math.round((m.swap_used / m.swap_total) * 100) : 0
    ),
  };

  function getMetricColor(percent) {
    if (percent < 20) return "#37fc47ff"; 
    if (percent < 65) return "#ffa600ff";  
    return "#ff3b30ff";                    
  }

  // Safe accessors for current metrics
  const currentMetric = metrics[0] || DEFAULT_METRIC;
  const currentHealth = health[0] || DEFAULT_HEALTH;

  return (
    <>
      <div>
        <Container className="mt-4">
          <Row className="mb-4 g-3">
            <Col md={2}>
              <DisplayCard 
                value={(currentHealth.status ? "ONLINE" : "OFFLINE")} 
                color={currentHealth.status ? "#37fc47ff" : "#ff7349ff"}
                message={"STATUS"} 
              />
            </Col>
            <Col md={2}>
                
              <DisplayCard
              value={(currentMetric.cpu_usage || 0) + "%"}
              color={getMetricColor((Math.round((currentMetric.cpu_usage || 0))))}
              message={"CPU USAGE"} />

            </Col>
            <Col md={2}>
              <DisplayCard 
                value={(Math.round((currentMetric.memory_usage_percent || 0) * 100) / 100) + "%"} 
                color={getMetricColor((Math.round((currentMetric.memory_usage_percent || 0) * 100) / 100))}
                message={"MEMORY USAGE"} 
              />
            </Col>
            <Col md={2}>
              <DisplayCard 
                value={Math.round(((currentMetric.disk_usage_used || 0) / (currentMetric.disk_usage_total || 1)) * 100) + "%"} 
                color={getMetricColor((Math.round(((currentMetric.disk_usage_used || 0) / (currentMetric.disk_usage_total || 1)) * 100)))}
                message={"DISK USAGE"} 
              />
            </Col>
            <Col md={2}>
              <DisplayCard 
                value={Math.round(((currentMetric.swap_used || 0) / (currentMetric.swap_total || 1)) * 100) + "%"} 
                color={getMetricColor((Math.round(((currentMetric.swap_used || 0) / (currentMetric.swap_total || 1)) * 100)))}
                message={"SWAP USAGE"} 
              />
            </Col>
            <Col md={2}>
              <DisplayCard value={currentMetric.connections || 0} message={"CONN"} />
            </Col>
            
          </Row>
          <Button variant="secondary" className="text-white mb-2" onClick={() => navigate(`/server/events/${id}/create`)}>Create Event</Button>
          <Card className="h-100 border-start border-4 border-secondary mb-4">
            <Card.Body className="py-3">
              <LineChart
                xAxis={[
                  {
                    data: chartData.xData,
                    label: "Metrics",
                    labelStyle: {
                      fill: "#fff",
                      fontSize: 14,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Percentage (%)",
                    labelStyle: {
                      fill: "#fff",
                      fontSize: 14,
                    },
                  },
                ]}
                series={[
                  {
                    data: chartData.cpuUsage,
                    label: "CPU Usage",
                    color: "#ffa657",
                    showMark: false
                  },
                  {
                    data: chartData.memoryUsage,
                    label: "Memory Usage",
                    color: "#d2a8ff",
                    showMark: false
                  },
                  {
                    data: chartData.diskUsage,
                    label: "Disk Usage",
                    color: "#f85149",
                    showMark: false
                  },
                  {
                    data: chartData.swapUsage,
                    label: "Swap Usage",
                    color: "#97355bff",
                    showMark: false
                  },
                  {
                    data: chartData.connections,
                    label: "Live Connections",
                    color: "#799eafff",
                    showMark: false
                  },
                ]}
                height={500}
                sx={{
                  width: "100%",
                  backgroundColor: "#1e1e1e",
                  "& .MuiChartsAxis-line": { stroke: "#fff" },
                  "& .MuiChartsAxis-tick": { stroke: "#fff" },
                  "& .MuiChartsAxis-tickLabel": { fill: "#fff" },
                  "& .MuiChartsLegend-series text": {
                    fill: "#fff !important",
                  },
                  "& .MuiChartsLegend-mark": { rx: 2 },
                }}
              />
            </Card.Body>
          </Card>
        </Container>
      </div>
      <div>
        <Container className="mt-4">
          <Card className="h-100 border-start border-4 border-secondary bg-dark">
            <Card.Body className="py-3">
              <div style={{ minHeight: "50vh" }}>

                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search stats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-dark"
                    style={{
                      width: "50%",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      color: "#c9d1d9",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Query Limit"
                    value={queryLimit}
                    min={10}
                    max={200}
                    interval={10}
                    onChange={(e) => setQueryLimit(Number(e.target.value))}
                    className="bg-dark"
                    style={{
                      width: "25%",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      color: "#c9d1d9",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>

                <Tabs
                defaultActiveKey="metrics"
                id="uncontrolled-tab-example"
                className="mb-3"
              >
                <Tab eventKey="metrics" title="Metrics">
                  {filteredMetrics.length === 0 ? (
                  <AlertDefaultNotice 
                    title="0 Metrics" 
                    message={`There is no metrics found for the query "${searchTerm}"`} 
                  />
                ) : (
                  <div
                    style={{
                      maxHeight: "calc(100vh - 150px)",
                      overflowY: "auto",
                    }}
                  >
                    {filteredMetrics.map((metric, index) => (
                      <div
                        key={metric?.id || index}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          padding: "12px 16px",
                          background: index % 2 === 0 ? "#0c0c0cff" : "#222222ff",
                          color: "#c9d1d9",
                          borderLeft: "3px solid #202020ff",
                          marginBottom: "2px",
                        }}
                      >
                        <span style={{ color: "#8b949e", minWidth: "160px" }}>
                          [{metric?.timestamp || getTimestamp()}]
                        </span>
                        <span style={{ color: "#7ee787" }}>
                          ID: {metric?.id || "N/A"}
                        </span>
                        <span style={{ color: "#ffa657" }}>
                          CPU Count: {metric?.num_of_cpu || "N/A"} ({(metric?.cpu_usage || 0) + "%" || "N/A"})
                        </span>
                        <span style={{ color: "#d2a8ff" }}>
                          Memory Usage: {metric?.memory_usage || "N/A"} / {metric?.memory_allocated || "N/A"} ({Math.round((metric?.memory_usage_percent || 0) * 100) / 100 + "%" || "N/A"})
                        </span>
                        <span style={{ color: "#f85149" }}>
                          Disk Usage: {metric?.disk_usage_used || "N/A"} / {metric?.disk_usage_total || "N/A"}
                        </span>
                        <span style={{ color: "#799eafff" }}>
                          CONN: {metric?.connections || "0"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                </Tab>
                <Tab eventKey="health" title="Health">
                  {health.length === 0 ? (
                  <AlertDefaultNotice 
                    title="0 Health Logs" 
                    message={`There is no health logs found for the query "${searchTerm}"`} 
                  />
                ) : (
                  <div
                    style={{
                      maxHeight: "calc(100vh - 150px)",
                      overflowY: "auto",
                    }}
                  >
                    {health.map((h, index) => (
                      <div
                        key={h?.id || index}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "16px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          padding: "12px 16px",
                          background: index % 2 === 0 ? "#0c0c0cff" : "#222222ff",
                          color: "#c9d1d9",
                          borderLeft: "3px solid #202020ff",
                          marginBottom: "2px",
                        }}
                      >
                        <span style={{ color: "#8b949e", minWidth: "160px" }}>
                          [{h?.timestamp || getTimestamp()}]
                        </span>
                        <span style={{ color: "#7ee787" }}>
                          ID: {h?.id || "N/A"}
                        </span>
                        <span style={{ color: h?.status ? "#37fc47ff" : "#ff7349ff" }}>
                          STATUS: {(h?.status ? "ONLINE" : "OFFLINE")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                </Tab>
              </Tabs>

                
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
}

export default ServerMetricsPage;