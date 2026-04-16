import { Badge } from "react-bootstrap";
import "./CustomBadge.css";

function CustomBadge({ variant = "secondary", text }) {
  return (
    <Badge className={`custom-badge custom-badge-${variant.toLocaleLowerCase()}`}>
      {text}
    </Badge>
  );
}

export default CustomBadge;
