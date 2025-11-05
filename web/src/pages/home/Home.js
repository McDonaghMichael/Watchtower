import { useState, useEffect } from "react";
import { Col, Row } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import DisplayCard from "../../components/metrics/DisplayCard";
import { LineChart } from '@mui/x-charts/LineChart';

function Home() {
  const [chartData, setChartData] = useState({
    xData: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    series1: [2, 5.5, 2, 8.5, 1.5, 5, 7, 3, 6, 4],
    series2: [4, 3, 6, 2, 7, 4, 5, 8, 3, 6],
    series3: [1, 4, 3, 6, 2, 7, 4, 5, 7, 3]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
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
          series3: newSeries3Data
        };
      });
    }, 100); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
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
        <LineChart
          xAxis={[{ 
            data: chartData.xData,
            label: 'Time',
            labelStyle: {
              fill: '#ca6f6fff',
              fontSize: 14,

            }
          }]}
          yAxis={[{
            label: 'Value',
            labelStyle: {
              fill: '#805a5aff',
              fontSize: 14,
            }
          }]}
          series={[
            {
              data: chartData.series1,
              label: 'CPU Usage',
              color: '#0d00ffff',
            },
            {
              data: chartData.series2,
              label: 'Memory Usage',
              color: '#00ff62ff',
            },
            {
              data: chartData.series3,
              label: 'Network Traffic',
              color: '#ffa600ff',
            },
          ]}
          height={500}
          sx={{
            backgroundColor: '#1e1e1e',
            '& .MuiChartsAxis-line': { stroke: '#fff' },
            '& .MuiChartsAxis-tick': { stroke: '#fff' },
            '& .MuiChartsAxis-tickLabel': { fill: '#fff' },
            '& .MuiChartsLegend-series text': { fill: '#fff !important' },
            '& .MuiChartsLegend-mark': { rx: 2 },
          }}
        />
      </Container>
    </div>
  );
}

export default Home;