import { Spinner } from "react-bootstrap";

export default function LoadingOverlay({ show }) {
  if (!show) return null;
  return (
    <div className="spinner-overlay">
      <Spinner animation="border" variant="info" />
    </div>
  );
}
