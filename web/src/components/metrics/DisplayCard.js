import Card from "react-bootstrap/Card";
import { PiComputerTowerFill } from "react-icons/pi";

function DisplayCard({ message, value, color }) {
  const accent = color || "var(--accent)";

  return (
    <Card className="h-100 border-0 display-card">
      <Card.Body className="py-3 d-flex align-items-center">
        <div className="p-3 rounded-3 me-3 d-flex align-items-center justify-content-center pill-icon" style={{
            minWidth: "52px",
            minHeight: "52px",
          }}>
          <PiComputerTowerFill className="fs-4" style={{ color: accent }} />
        </div>

        <div>
          <Card.Title className="small mb-1 label-muted">
            {message}
          </Card.Title>
          <h4 className="mb-0 fw-semibold" style={{ color: accent }}>
            {value}
          </h4>
        </div>
      </Card.Body>
    </Card>
  );
}

export default DisplayCard;
