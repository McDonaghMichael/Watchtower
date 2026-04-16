import React, { useEffect, useMemo, useState } from "react";
import { Container, Button, Card, Row, Col, Badge } from "react-bootstrap";
import apiClient from "../../api/client";
import { useTheme } from "../../theme/ThemeProvider";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { ListItemIcon, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CelebrationIcon from "@mui/icons-material/Celebration";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import PingBadge from "../../components/badges/PingBadge";
import CustomBadge from "../../components/badges/CustomBadge";
import StatusBadge from "../../components/badges/StatusBadge";
import InstallProgressModal from "../../components/InstallProgressModal";
import AgentLogsModal from "../../components/AgentLogsModal";
import DisplayCard from "../../components/notices/DisplayCard";

function ServersPage() {
  var navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const tc = {
    paper: isDark ? "#1e1e1e" : "#ffffff",
    headBg: isDark ? "#2d2d2d" : "#f0f0f0",
    headText: isDark ? "#ffffff" : "#111111",
    cellBg: isDark ? "#1e1e1e" : "#ffffff",
    cellText: isDark ? "#e0e0e0" : "#333333",
    border: isDark ? "#404040" : "#e0e0e0",
    hoverBg: isDark ? "#2d2d2d" : "#f5f5f5",
    toolbarBg: isDark ? "#2d2d2d" : "#f0f0f0",
    iconColor: isDark ? "#ffffff" : "#333333",
    menuBg: isDark ? "#2d2d2d" : "#ffffff",
    menuText: isDark ? "#ffffff" : "#111111",
  };

  const [servers, setServers] = useState([]);
  const [message, setMessage] = useState(null);
  const [installingId, setInstallingId] = useState(null);
  const [progressServer, setProgressServer] = useState(null);
  const [logsServer, setLogsServer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteNotice, setDeleteNotice] = useState({ show: false, status: "success", title: "", message: "" });

  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
  const fetchServers = () => {
    apiClient
      .get(`/servers`)
      .then(async (res) => {
        console.log("Response data:", res.data);

        // Fetch all health statuses
        const healthResponse = await apiClient.get(`/health`);
        const healthData = healthResponse.data || [];
        
        console.log("Health data:", healthData);

        // Create a map of server_id to health status for quick lookup
        const healthMap = {};
        healthData.forEach(health => {
          healthMap[health.id] = health;
        });

        // Add health status to each server
        const serversWithHealth = (res.data || []).map(server => ({
          ...server,
          health: healthMap[server.id] || null
        }));

        console.log("Servers with health:", serversWithHealth);

        setServers(serversWithHealth);
      })
      .catch((err) => {
        console.error("Error fetching servers:", err);
      });
  }

  fetchServers();
}, []);

  const columns = useMemo(
    () => [
      {
        header: "ID",
        accessorKey: "id",
        size: 50,
      },
      {
        header: "Server Name",
        accessorKey: "server_name",
      },
      {
        header: "IP Address",
        accessorKey: "ip_address",
      },
      {
        header: "Status",
        accessorKey: "health.status",
        Cell: ({ cell }) => <StatusBadge status={(cell.getValue()? "ONLINE" : "OFFLINE" )} />,
      },
      {
        header: "Operating System",
        accessorKey: "operating_system",
        Cell: ({ cell }) => <StatusBadge status={cell.getValue()} />,
      },
      {
        header: "Environment",
        accessorKey: "environment",
      },
      {
        header: "Location",
        accessorKey: "location",
      },
      {
        header: "Last Ping",
        accessorKey: "last_ping",
        Cell: ({ cell, row }) => {
          const value = cell.getValue();

          if (row.original.status === "warning") {
            return <CustomBadge variant={"warning"} text={"WARNING"} />;
          }

          if (!value) return <PingBadge seconds={null} />;

          const lastPingTime = new Date(value).getTime();
          const seconds = (currentTime - lastPingTime) / 1000;
          return <PingBadge seconds={Math.abs(Math.floor(seconds))} />;
        },
      },
    ],
    [currentTime]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const table = useMaterialReactTable({
    columns,
    data: servers,
    enableColumnFilterModes: true,
    enableColumnOrdering: true,
    enableGrouping: true,
    enableColumnPinning: true,
    enableFacetedValues: true,
    enableRowActions: true,
    enableRowSelection: false,
    enableGlobalFilter: true,
    initialState: {
      showColumnFilters: false,
      showGlobalFilter: false,
      columnPinning: {
        left: ["mrt-row-expand", "mrt-row-select"],
        right: ["mrt-row-actions"],
      },
    },
    paginationDisplayMode: "pages",
    positionToolbarAlertBanner: "bottom",
    muiSearchTextFieldProps: {
      size: "small",
      variant: "outlined",
    },
    muiPaginationProps: {
      color: "info",
      rowsPerPageOptions: [25, 50, 100],
      shape: "rounded",
      variant: "outlined",
    },
    muiTablePaperProps: {
      sx: { backgroundColor: tc.paper },
    },
    muiTableProps: {
      sx: { backgroundColor: tc.paper },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: tc.headBg,
        color: tc.headText,
        borderBottom: `1px solid ${tc.border}`,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        backgroundColor: tc.cellBg,
        color: tc.cellText,
        borderBottom: `1px solid ${tc.border}`,
      },
    },
    muiTableBodyRowProps: {
      sx: {
        "&:hover td": { backgroundColor: tc.hoverBg },
        "& .MuiSvgIcon-root": { fill: tc.iconColor, color: tc.iconColor },
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: tc.toolbarBg,
        color: tc.headText,
        "& .MuiIconButton-root": { color: tc.iconColor },
        "& .MuiButtonBase-root": { color: tc.iconColor },
        "& .MuiSvgIcon-root": { fill: tc.iconColor, color: tc.iconColor },
        "& .MuiInputBase-root": { color: tc.cellText },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: tc.border },
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: tc.toolbarBg,
        color: tc.headText,
        "& .MuiTablePagination-root": { color: tc.headText },
        "& .MuiTablePagination-selectLabel": { color: tc.headText },
        "& .MuiTablePagination-displayedRows": { color: tc.headText },
        "& .MuiTablePagination-select": { color: tc.headText },
        "& .MuiIconButton-root": { color: tc.iconColor },
        "& .MuiFormLabel-root": { color: tc.headText },
        "& .MuiSvgIcon-root": { fill: tc.iconColor },
      },
    },
    muiRowActionMenuProps: {
      PaperProps: {
        sx: { backgroundColor: tc.menuBg, color: tc.menuText },
      },
    },
    mrtTheme: {
      baseBackgroundColor: tc.paper,
    },
    state: {
      isLoading: false,
    },
    renderRowActionMenuItems: ({ row }) => [
      <MenuItem
        key="install"
        onClick={() => handleInstall(row.original)}
        disabled={installingId === row.original.id}
        sx={{ m: 0, color: tc.menuText }}
      >
        <ListItemIcon>
          {row.original.last_ping ? (
            <SystemUpdateAltIcon sx={{ color: "#82b1ff" }} />
          ) : (
            <CloudDownloadIcon sx={{ color: "#82b1ff" }} />
          )}
        </ListItemIcon>
        {installingId === row.original.id
          ? "Working..."
          : row.original.last_ping
          ? "Update Agent"
          : "Install Agent"}
      </MenuItem>,
      <MenuItem
        key="ping"
        onClick={() => handlePing(row.original.id)}
        sx={{ m: 0, color: tc.menuText }}
      >
        <ListItemIcon>
          <SignalCellularAltIcon sx={{ color: "#4dd0e1" }} />
        </ListItemIcon>
        Ping
      </MenuItem>,
      <MenuItem
        key="view_metrics"
        onClick={() => navigate(`/server/metrics/${row.original.id}`)}
        sx={{ m: 0, color: tc.menuText }}
      >
        <ListItemIcon>
          <AssessmentIcon sx={{ color: "#ffb74d" }} />
        </ListItemIcon>
        View Metrics
      </MenuItem>,
      <MenuItem
        key="view_events"
        onClick={() => navigate(`/server/events/${row.original.id}`)}
        sx={{ m: 0, color: tc.menuText }}
      >
        <ListItemIcon>
          <CelebrationIcon sx={{ color: "#ce93d8" }} />
        </ListItemIcon>
        View Events
      </MenuItem>,
      <MenuItem
        key="view_logs"
        onClick={() => setLogsServer({ id: row.original.id, name: row.original.server_name })}
        sx={{ m: 0, color: tc.menuText }}
      >
        <ListItemIcon>
          <ArticleIcon sx={{ color: "#80cbc4" }} />
        </ListItemIcon>
        View Agent Logs
      </MenuItem>,
      <MenuItem
        key="edit_server"
        onClick={() => navigate(`/server/edit/${row.original.id}`)}
        sx={{ m: 0, color: tc.menuText }}
      >
        <ListItemIcon>
          <SettingsIcon sx={{ color: "#9e9e9e" }} />
        </ListItemIcon>
        Edit Server
      </MenuItem>,
      <MenuItem
        key="delete_server"
        onClick={() => handleDelete(row.original)}
        sx={{ m: 0, color: "#ef5350" }}
      >
        <ListItemIcon>
          <DeleteIcon sx={{ color: "#ef5350" }} />
        </ListItemIcon>
        Delete Server
      </MenuItem>,
    ],
  });

  const handleDelete = (server) => {
    setDeleteTarget(server);
  };

  const confirmDelete = () => {
    const server = deleteTarget;
    setDeleteTarget(null);
    apiClient
      .delete(`/server/${server.id}`)
      .then(() => {
        setServers((prev) => prev.filter((s) => s.id !== server.id));
        setDeleteNotice({
          show: true,
          status: "success",
          title: "Server deleted",
          message: `"${server.server_name}" has been permanently removed.`,
        });
      })
      .catch((err) => {
        setDeleteNotice({
          show: true,
          status: "error",
          title: "Delete failed",
          message: err.response?.data?.error || "Could not delete this server. Please try again.",
        });
      });
  };

  const handleInstall = (server) => {
    setInstallingId(server.id);
    setMessage(null);
    apiClient
      .post(`/server/${server.id}/install`, { update: Boolean(server.last_ping) })
      .then(() => {
        setProgressServer({ id: server.id, name: server.server_name });
      })
      .catch((err) => {
        setMessage(err.response?.data?.error || "Install failed");
      })
      .finally(() => setInstallingId(null));
  };

  const handlePing = (id) => {
    apiClient
      .post(`/server/ping/${id}`)
      .then((res) => {
        console.log("Response data:", res.data);
        setServers((prevServers) =>
          prevServers.map((server) =>
            server.id === id ? { ...server, last_ping: res.data.ping } : server
          )
        );
        handleStatusCheck(id);
      })
      .catch((err) => {
        console.error("Error fetching servers:", err);
      });
  };

  const handleStatusCheck = (id) => {
    setServers((prevServers) =>
      prevServers.map((server) =>
        server.id === id ? { ...server, status: "loading" } : server
      )
    );

    apiClient
      .get(`/server/status/${id}`)
      .then((res) => {
        console.log("Response data:", res.data);
        setServers((prevServers) =>
          prevServers.map((server) =>
            server.id === id ? { ...server, status: res.data.status } : server
          )
        );
      })
      .catch((err) => {
        console.error("Error fetching servers:", err);
      });
  };

  const totalServers = servers.length;
  const onlineCount = servers.filter((s) => s.health?.status).length;
  const offlineCount = Math.max(totalServers - onlineCount, 0);
  const environments = servers.reduce((acc, s) => {
    if (s.environment) {
      acc[s.environment] = (acc[s.environment] || 0) + 1;
    }
    return acc;
  }, {});
  const topEnvs = Object.entries(environments).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const avgPing =
    servers.reduce((sum, s) => {
      const pingMs = s.last_ping ? new Date(s.last_ping).getTime() : null;
      return sum + (pingMs ? currentTime - pingMs : 0);
    }, 0) / (servers.length || 1);

  return (
    <Container fluid className="w-75 mt-5">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <h2 className="mb-1" style={{ color: "var(--text)" }}>Server Monitoring</h2>
          <p className="text-muted mb-0">
            Fleet overview, status, and quick actions.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-light"
            onClick={() => navigate(`/server/add`)}
          >
            Add Server
          </Button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Card.Body>
              <small className="text-uppercase" style={{ color: "var(--muted)" }}>Total</small>
              <h3 className="mb-0" style={{ color: "var(--text)" }}>{totalServers}</h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>Servers tracked</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Card.Body>
              <small className="text-uppercase" style={{ color: "var(--muted)" }}>Online</small>
              <h3 className="mb-0" style={{ color: "#7ee787" }}>{onlineCount}</h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>Healthy status</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Card.Body>
              <small className="text-uppercase" style={{ color: "var(--muted)" }}>Offline</small>
              <h3 className="mb-0" style={{ color: "#ff8a80" }}>{offlineCount}</h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>Unreachable</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <Card.Body>
              <small className="text-uppercase" style={{ color: "var(--muted)" }}>Avg Ping</small>
              <h3 className="mb-0" style={{ color: "var(--text)" }}>{Math.max(Math.round(avgPing / 1000), 0)}s</h3>
              <p className="mb-0 small" style={{ color: "var(--muted)" }}>Since last check</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <Card.Header className="border-0" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0" style={{ color: "var(--text)" }}>Environment Mix</h5>
              <small style={{ color: "var(--muted)" }}>Top environments by count</small>
            </div>
          </div>
        </Card.Header>
        <Card.Body style={{ background: "var(--card)" }}>
          {topEnvs.length === 0 && (
            <p className="mb-0" style={{ color: "var(--muted)" }}>No environment data yet.</p>
          )}
          <div className="d-flex flex-wrap gap-2">
            {topEnvs.map(([env, count]) => (
              <Badge key={env} bg="info" text="dark">
                {env} · {count}
              </Badge>
            ))}
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <Card.Header className="border-0 d-flex justify-content-between align-items-center" style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div>
            <h5 className="mb-0" style={{ color: "var(--text)" }}>Servers</h5>
            <small style={{ color: "var(--muted)" }}>Status, health, and actions</small>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {message && (
            <div className="alert alert-info m-3 mb-0 py-2">{message}</div>
          )}
          <MaterialReactTable table={table} />
        </Card.Body>
      </Card>
      <InstallProgressModal
        serverId={progressServer?.id}
        serverName={progressServer?.name}
        show={Boolean(progressServer)}
        onClose={() => setProgressServer(null)}
      />
      <AgentLogsModal
        serverId={logsServer?.id}
        serverName={logsServer?.name}
        show={Boolean(logsServer)}
        onClose={() => setLogsServer(null)}
      />
      <DisplayCard
        show={Boolean(deleteTarget)}
        status="warning"
        title="Delete server?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.server_name}"? This action cannot be undone.`}
        onClose={() => setDeleteTarget(null)}
        secondaryAction={{
          label: "Delete",
          variant: "danger",
          onClick: confirmDelete,
        }}
      />
      <DisplayCard
        show={deleteNotice.show}
        status={deleteNotice.status}
        title={deleteNotice.title}
        message={deleteNotice.message}
        onClose={() => setDeleteNotice((prev) => ({ ...prev, show: false }))}
      />
    </Container>
  );
}

export default ServersPage;
