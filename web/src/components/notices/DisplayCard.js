import React from "react";
import { Modal, Button } from "react-bootstrap";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./DisplayCard.css";

const statusConfig = {
  success: {
    color: "#7cffc4",
    bg: "rgba(124,255,196,0.08)",
    icon: CheckCircleOutlineIcon,
    title: "Success",
  },
  error: {
    color: "#ff8a80",
    bg: "rgba(255,138,128,0.08)",
    icon: HighlightOffIcon,
    title: "Error",
  },
  info: {
    color: "#82b1ff",
    bg: "rgba(130,177,255,0.08)",
    icon: InfoOutlinedIcon,
    title: "Info",
  },
  warning: {
    color: "#ffb74d",
    bg: "rgba(255,183,77,0.08)",
    icon: WarningAmberIcon,
    title: "Warning",
  },
};

function DisplayCard({
  show = false,
  status = "info",
  title,
  message,
  onClose,
  primaryAction,
  secondaryAction,
}) {
  const config = statusConfig[status] || statusConfig.info;
  const Icon = config.icon;

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      contentClassName="border-0 shadow-lg"
    >
      <Modal.Body className="display-card-body">
        <div className="d-flex align-items-center mb-3">
          <div
            className="display-card-icon me-3"
            style={{
              color: config.color,
              boxShadow: `0 0 0 1px ${config.bg}`,
            }}
          >
            <Icon fontSize="large" />
          </div>
          <div>
            <h5 className="mb-1 fw-semibold" style={{ color: config.color }}>
              {title || config.title}
            </h5>
            <p className="mb-0" style={{ color: "#cbd5e1" }}>
              {message}
            </p>
          </div>
        </div>
        <div className="display-card-actions">
          <Button variant="outline-light" onClick={onClose}>
            Close
          </Button>
          {secondaryAction && (
            <Button variant={secondaryAction.variant || "outline-danger"} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button variant="info" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default DisplayCard;
