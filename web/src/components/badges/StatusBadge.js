import CustomBadge from "./CustomBadge";

function StatusBadge({ status }) {



  return (
      <CustomBadge variant={status} text={status.toUpperCase()}/>
  );
}

export default StatusBadge;
