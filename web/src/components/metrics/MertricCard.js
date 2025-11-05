import { Card } from "react-bootstrap";
import { 
  FiArrowUp,
  FiArrowDown
} from 'react-icons/fi';

export default function MetricCard({ icon, title, value, change, loading, variant }) {
  return (
    <Card className={`border-${variant} border-top-0 border-end-0 border-bottom-0 border-4`}>
      <Card.Body>
        <div className="d-flex align-items-center">
          <div className={`bg-${variant}-subtle p-3 rounded me-3`}>
            {icon}
          </div>
          <div>
            <h6 className="text-muted mb-1">{title}</h6>
            {loading ? (
              <>
                <div className="placeholder placeholder-xs w-75"></div>
                <div className="placeholder placeholder-xs w-50 mt-1"></div>
              </>
            ) : (
              <>
                <h3 className="mb-0">{value}</h3>
                <small className={`text-${change.includes('+') ? 'success' : 'danger'} d-flex align-items-center`}>
                  {change.includes('+') ? <FiArrowUp className="me-1" /> : <FiArrowDown className="me-1" />}
                  {change}
                </small>
              </>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}