import Card from "react-bootstrap/Card";
import { PiComputerTowerFill } from "react-icons/pi";

function DisplayCard({message, value}){

    const getMetricColor = (v) => {
      return "secondary"
    }

    return (
        <>
        <Card className={"h-100 border-start border-4 border-" + getMetricColor(value)}>
              <Card.Body className="py-3">
                <div className="d-flex align-items-center">
                  <div className={"bg-opacity-10 p-3 rounded me-3 bg-" + getMetricColor(value)}>
                    <PiComputerTowerFill className={"fs-4 text-" + getMetricColor(value)}/>
                  </div>
                  <div>
                    <Card.Title className="text-muted small mb-1">{message}</Card.Title>
                    <h4 className={"mb-0 text-" + getMetricColor(value)}>{value}</h4>
                  </div>
                </div>
              </Card.Body>
            </Card>
        </>
    )
}

export default DisplayCard;