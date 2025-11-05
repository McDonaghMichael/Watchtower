import CustomBadge from "./CustomBadge";

function PingBadge({ seconds }) {
  let content;
  let color = "secondary";

  if (seconds <= 1) {
    content = "Re-establishing connection";
    color = "secondary";
  } else if (seconds < 60 && seconds > 1) {
    content = `${seconds}s` || "0s";
    color = "secondary";
  } else if (seconds >= 60 && seconds < 900) {
    content = `${seconds}s` || "0s";
    color = "info";
  } else {
    content = `${seconds}s` || "0s";
    color = "success";
  }

  return (
    <CustomBadge bg={color}>
      {content}
    </CustomBadge>
  );
}

export default PingBadge;
