import Card from "react-bootstrap/Card";
import { PiComputerTowerFill } from "react-icons/pi";

function DisplayCard({ message, value, color }) {
  const accent = color || "#82b1ff";

  return (
    <Card
      className="h-100 border-0 shadow-sm text-light"
      style={{
        background: "#0f172a",
        borderRadius: "14px",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Card.Body className="py-3 d-flex align-items-center">
        <div
          className="p-3 rounded-3 me-3 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            minWidth: "52px",
            minHeight: "52px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <PiComputerTowerFill className="fs-4" style={{ color: accent }} />
        </div>

        <div>
          <Card.Title className="small mb-1 text-secondary">
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
