import React, { useEffect, useMemo, useState } from "react";
import { Container, Button, Card, Row, Col, Badge } from "react-bootstrap";
import apiClient from "../../api/client";
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
import PingBadge from "../../components/badges/PingBadge";
import CustomBadge from "../../components/badges/CustomBadge";
import StatusBadge from "../../components/badges/StatusBadge";
import InstallProgressModal from "../../components/InstallProgressModal";

function ServersPage() {
  var navigate = useNavigate();

  const [servers, setServers] = useState([]);
  const [message, setMessage] = useState(null);
  const [installingId, setInstallingId] = useState(null);
  const [progressServer, setProgressServer] = useState(null);

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

          const lastPingTime = new Date(value).getTime();
          const currentMsDifference = currentTime - lastPingTime;
          const seconds = currentMsDifference / 1000;
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
    // Dark mode styling
    muiTablePaperProps: {
      sx: {
        backgroundColor: "#1e1e1e",
      },
    },
    muiTableProps: {
      sx: {
        backgroundColor: "#1e1e1e",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: "#2d2d2d",
        color: "#fff",
        borderBottom: "1px solid #404040",
      },
      
    },
    muiTableBodyCellProps: {
      sx: {
        backgroundColor: "#1e1e1e",
        color: "#e0e0e0",
        borderBottom: "1px solid #404040",
        
      },
    },
    muiTableBodyRowProps: {
      sx: {
        "&:hover": {
          backgroundColor: "#2d2d2d",
        },
        "& .MuiSvgIcon-root": {
          fill: "#fff",
          color: "#fff",
        },
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "#2d2d2d",
        color: "#fff",
        "& .MuiIconButton-root": {
          color: "#fff",
        },
        "& .MuiButtonBase-root": {
          color: "#fff",
        },
"& .MuiSvgIcon-root": {
          fill: "#fff",
          color: "#fff",
        },
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: "#2d2d2d",
        color: "#fff",
        "& .MuiTablePagination-root": {
          color: "#fff",
        },
        "& .MuiTablePagination-selectLabel": {
          color: "#fff",
        },
        "& .MuiTablePagination-displayedRows": {
          color: "#fff",
        },
        "& .MuiTablePagination-select": {
          color: "#fff",
        },
        "& .MuiIconButton-root": {
          color: "#fff",
        },
        "& .MuiFormLabel-root": {
          color: "#fff",
        },
        "& .MuiSvgIcon-root": {
          fill: "#fff",
        },
      },
    },
    muiRowActionMenuProps: {
      PaperProps: {
        sx: {
          backgroundColor: "#2d2d2d",
          color: "#fff",
        },
      },
    },
    mrtTheme: {
      baseBackgroundColor: "#1e1e1e",
    },
    state: {
      isLoading: false,
    },
    renderRowActionMenuItems: ({ row }) => [
      <MenuItem
        key="install"
        onClick={() => handleInstall(row.original)}
        disabled={installingId === row.original.id}
        sx={{ m: 0, color: "#fff" }}
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
        sx={{ m: 0, color: "#fff" }}
      >
        <ListItemIcon>
          <SignalCellularAltIcon sx={{ color: "#4dd0e1" }} />
        </ListItemIcon>
        Ping
      </MenuItem>,
      <MenuItem
        key="view_metrics"
        onClick={() => navigate(`/server/metrics/${row.original.id}`)}
        sx={{ m: 0, color: "#fff" }}
      >
        <ListItemIcon>
          <AssessmentIcon sx={{ color: "#ffb74d" }} />
        </ListItemIcon>
        View Metrics
      </MenuItem>,
      <MenuItem
        key="view_events"
        onClick={() => navigate(`/server/events/${row.original.id}`)}
        sx={{ m: 0, color: "#fff" }}
      >
        <ListItemIcon>
          <CelebrationIcon sx={{ color: "#ce93d8" }} />
        </ListItemIcon>
        View Events
      </MenuItem>,
      <MenuItem
        key="edit_server"
        onClick={() => navigate(`/server/edit/${row.original.id}`)}
        sx={{ m: 0, color: "#fff" }}
      >
        <ListItemIcon>
          <SettingsIcon sx={{ color: "#9e9e9e" }} />
        </ListItemIcon>
        Edit Server
      </MenuItem>,
    ],
  });

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
          <h2 className="mb-1 text-white">Server Monitoring</h2>
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
          <Card className="shadow-sm border-0 bg-dark text-light">
            <Card.Body>
              <small className="text-uppercase text-muted">Total</small>
              <h3 className="mb-0">{totalServers}</h3>
              <p className="text-muted mb-0 small">Servers tracked</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-dark text-light">
            <Card.Body>
              <small className="text-uppercase text-muted">Online</small>
              <h3 className="mb-0 text-success">{onlineCount}</h3>
              <p className="text-muted mb-0 small">Healthy status</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-dark text-light">
            <Card.Body>
              <small className="text-uppercase text-muted">Offline</small>
              <h3 className="mb-0 text-danger">{offlineCount}</h3>
              <p className="text-muted mb-0 small">Unreachable</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0 bg-dark text-light">
            <Card.Body>
              <small className="text-uppercase text-muted">Avg Ping</small>
              <h3 className="mb-0">{Math.max(Math.round(avgPing / 1000), 0)}s</h3>
              <p className="text-muted mb-0 small">Since last check</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm border-0 bg-dark text-light mb-4">
        <Card.Header className="bg-dark border-0">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Environment Mix</h5>
              <small className="text-muted">Top environments by count</small>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="bg-dark">
          {topEnvs.length === 0 && (
            <p className="text-muted mb-0">No environment data yet.</p>
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

      <Card className="shadow-sm border-0 bg-dark text-light">
        <Card.Header className="bg-dark border-0 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0">Servers</h5>
            <small className="text-muted">Status, health, and actions</small>
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
    </Container>
  );
}

export default ServersPage;
