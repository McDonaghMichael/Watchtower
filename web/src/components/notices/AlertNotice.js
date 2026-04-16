function AlertNotice({ error }) {

    console.log(error)
  return (
    <div
      style={{
        padding: "20px",
        background: "#0d1117",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "8px",
          padding: "48px 32px",
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>
          {error.status === 404 ? "🔍" : "⚠️"}
        </div>
        <div
          style={{
            color: "#f85149",
            fontSize: "24px",
            fontWeight: "600",
            marginBottom: "12px",
          }}
        >
          {error.status === 404 ? "Not Found" : "Error"}
        </div>
        <div
          style={{ color: "#8b949e", fontSize: "14px", marginBottom: "8px" }}
        >
          {error.message}
        </div>
        <div
          style={{
            color: "#6e7681",
            fontSize: "13px",
            fontFamily: "monospace",
            marginTop: "16px",
            padding: "12px",
            background: "#0d1117",
            borderRadius: "6px",
          }}
        >
          Status: {error.status || "Network Error"}
        </div>
      </div>
    </div>
  );
}
export default AlertNotice;
