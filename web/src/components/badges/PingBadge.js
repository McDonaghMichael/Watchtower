import CustomBadge from "./CustomBadge";

function PingBadge({ seconds }) {
  let content;
  let color;

  if (seconds == null || isNaN(seconds)) {
    content = "Never";
    color = "secondary";
  } else if (seconds <= 1) {
    content = "Just now";
    color = "secondary";
  } else if (seconds < 60) {
    content = `${seconds}s ago`;
    color = "secondary";
  } else if (seconds < 900) {
    content = `${seconds}s ago`;
    color = "info";
  } else {
    content = `${seconds}s ago`;
    color = "success";
  }

  return <CustomBadge variant={color} text={content} />;
}

export default PingBadge;
