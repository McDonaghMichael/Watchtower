import { Card } from "react-bootstrap";

function AlertDefaultNotice({ title, message }) {
  return (
    <div
      style={{
        padding: "20px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
        <div
        style={{
          padding: "48px 32px",
          textAlign: "center",
          width: "25%"
        }}
        className="border-start border-end border-4 border-danger"
      >
      <Card className="h-25 text-center border-0">
        <Card.Body className="py-3 text-center">
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>{title}</div>
          {message}
        </Card.Body>
      </Card>
    </div>
    </div>
  );
}
export default AlertDefaultNotice;
