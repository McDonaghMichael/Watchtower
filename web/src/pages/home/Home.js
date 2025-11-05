import { Col, Row } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import { FaEuroSign, FaMoneyBillWave } from "react-icons/fa";
import { PiComputerTowerFill } from "react-icons/pi";
import DisplayCard from "../../components/metrics/DisplayCard";

function Home() {
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
      </Container>
    </div>
  );
}

export default Home;
