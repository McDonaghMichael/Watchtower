import Card from "react-bootstrap/Card";
import { PiComputerTowerFill } from "react-icons/pi";

function DisplayCard(){
    return (
        <>
        <Card className="h-100 border-start border-4 border-danger">
              <Card.Body className="py-3">
                <div className="d-flex align-items-center">
                  <div className="bg-danger bg-opacity-10 p-3 rounded me-3">
                    <PiComputerTowerFill className="text-danger fs-4" />
                  </div>
                  <div>
                    <Card.Title className="text-muted small mb-1">Stat here</Card.Title>
                    <h4 className="mb-0 text-danger">{3}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
        </>
    )
}

export default DisplayCard;