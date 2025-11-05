import { Alert } from "react-bootstrap";
import './AlertBadge.css';

function AlertBadge({status, message, index, id}){
    return (
        <>
        <Alert key={index} variant={status} className="alert-badge">
          <strong>{id}:</strong> {message}
        </Alert>
        </>
    )
}

export default AlertBadge;