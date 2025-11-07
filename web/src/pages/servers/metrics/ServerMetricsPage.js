import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AlertNotice from "../../../components/notices/AlertNotice";
import { getTimestamp } from "../../../utils/timeUtils";
import LoadingSpinner from "../../../components/misc/LoadingSpinner";
import { Col, Row, Card } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import DisplayCard from "../../../components/metrics/DisplayCard";
import { LineChart } from "@mui/x-charts/LineChart";
import AlertDefaultNotice from "../../../components/notices/AlertDefaultNotice";

const API_BASE_URL = process.env.REACT_APP_API_URL;

function ServerMetricsPage() {
  const { id } = useParams();

  const [metrics, setMetrics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [queryLimit, setQueryLimit] = useState(100);

  const [error, setError] = useState(null);

  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState({
    xData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    series1: [2, 5.5, 2, 8.5, 1.5, 5, 7, 3, 6, 4],
    series2: [4, 3, 6, 2, 7, 4, 5, 8, 3, 6],
    series3: [1, 4, 3, 6, 2, 7, 4, 5, 7, 3],
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newX = prev.xData[prev.xData.length - 1] + 1;
        const newSeries1 = Math.random() * 10;
        const newSeries2 = Math.random() * 10;
        const newSeries3 = Math.random() * 10;

        const newXData = [...prev.xData.slice(1), newX];
        const newSeries1Data = [...prev.series1.slice(1), newSeries1];
        const newSeries2Data = [...prev.series2.slice(1), newSeries2];
        const newSeries3Data = [...prev.series3.slice(1), newSeries3];

        return {
          xData: newXData,
          series1: newSeries1Data,
          series2: newSeries2Data,
          series3: newSeries3Data,
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/metrics/server/${id}?limit=${queryLimit}`
        );
        const data = Array.isArray(res.data) ? res.data : [res.data];
        console.log(data);
        setMetrics(data);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error(err);
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

  if (loading) return <LoadingSpinner />;

  if (error) return <AlertNotice id={id} error={error} />;

  const filteredMetrics = metrics.filter((metric) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      String(metric.id || "")
        .toLowerCase()
        .includes(search) ||
      String(metric.num_of_cpu || "")
        .toLowerCase()
        .includes(search) ||
      String(metric.memory_allocated || "")
        .toLowerCase()
        .includes(search) ||
      String(metric.disk_usage_used || "")
        .toLowerCase()
        .includes(search)
    );
  });

  return (
    <>
      <div>
        <Container className="mt-4">
          <Row className="mb-4 g-3">
            <Col md={3}>
              <DisplayCard />
            </Col>
            <Col md={3}>
              <DisplayCard />
            </Col>
            <Col md={3}>
              <DisplayCard />
            </Col>
            <Col md={3}>
              <DisplayCard />
            </Col>
          </Row>
          <Card className="h-100 border-start border-4 border-danger">
            <Card.Body className="py-3">
              <LineChart
                xAxis={[
                  {
                    data: chartData.xData,
                    label: "Time",
                    labelStyle: {
                      fill: "#ca6f6fff",
                      fontSize: 14,
                    },
                  },
                ]}
                yAxis={[
                  {
                    label: "Value",
                    labelStyle: {
                      fill: "#805a5aff",
                      fontSize: 14,
                    },
                  },
                ]}
                series={[
                  {
                    data: chartData.series1,
                    label: "CPU Usage",
                    color: "#0d00ffff",
                  },
                  {
                    data: chartData.series2,
                    label: "Memory Usage",
                    color: "#00ff62ff",
                  },
                  {
                    data: chartData.series3,
                    label: "Network Traffic",
                    color: "#ffa600ff",
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
          <Card className="h-100 border-start border-4 border-danger bg-dark">
            <Card.Body className="py-3">
              <div
                style={{
                  minHeight: "100vh",
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    marginBottom: "10px",
                    fontFamily: "monospace",
                    color: "#c9d1d9",
                  }}
                >
                  <span style={{ color: "#7ee787" }}>SERVER_METRICS</span>
                  <span style={{ color: "#8b949e" }}> // </span>
                  <span style={{ color: "#ffa657" }}>server_id={id}</span>
                  <span style={{ color: "#8b949e" }}> // </span>
                  <span style={{ color: "#79c0ff" }}>
                    count={filteredMetrics.length}
                  </span>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Search metrics..."
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
                    onChange={(e) => setQueryLimit(e.target.value)}
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

                {filteredMetrics.length === 0 ? (
                  <AlertDefaultNotice title="0 Metrics" message={"There is no metrics found for the query " + searchTerm} />
                ) : (
                  <div
                    style={{
                      maxHeight: "calc(100vh - 150px)",
                      overflowY: "auto",
                    }}
                  >
                    {filteredMetrics.map((metric, index) => (
                      <div
                        key={metric.id || index}
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
                          [{getTimestamp()}]
                        </span>
                        <span style={{ color: "#7ee787" }}>
                          ID: {metric.id || "N/A"}
                        </span>
                        <span style={{ color: "#ffa657" }}>
                          CPU Count: {metric.num_of_cpu || "N/A"}
                        </span>
                        <span style={{ color: "#d2a8ff" }}>
                          Memory Usage: {metric.memory_allocations || "N/A"} / {metric.memory_allocated || "N/A"}
                        </span>
                        <span style={{ color: "#56d364" }}>
                        </span>
                        <span style={{ color: "#f85149" }}>
                          Disk Usage: {metric.disk_usage_used || "N/A"} / {metric.disk_usage_total || "N/A"}
                        </span>
                        <span style={{ color: "#a557ffff" }}>
                          SSH: {metric.ssh_connections || "N/A"}
                        </span>
                        <span style={{ color: "#79c0ff" }}>
                          HTTP: {metric.http_connections || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
}

export default ServerMetricsPage;
