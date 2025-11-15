import Card from "react-bootstrap/Card";
import { PiComputerTowerFill } from "react-icons/pi";

function DisplayCard({ message, value, color }) {
  
  const lightBg = color + "15"; 

  return (
    <>
      <Card
        className="h-100 border-start border-4"
        style={{ borderLeftColor: color }}   
      >
        <Card.Body className="py-3">
          <div className="d-flex align-items-center">

            <div
              className="p-3 rounded me-3"
              style={{
                backgroundColor: lightBg,
              }}
            >
              <PiComputerTowerFill
                className="fs-4"
                style={{ color: color }}        
              />
            </div>

            <div>
              <Card.Title className="text-muted small mb-1">{message}</Card.Title>
              <h4 className="mb-0" style={{ color: color }}>
                {value}
              </h4>
            </div>

          </div>
        </Card.Body>
      </Card>
    </>
  );
}

export default DisplayCard;
