import React, { useEffect, useMemo, useState } from "react";
import { Container, Button, Alert } from "react-bootstrap";
import axios from "axios";
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
import AlertBadge from "../../components/notices/AlertBadge";
import PingBadge from "../../components/badges/PingBadge";
import CustomBadge from "../../components/badges/CustomBadge";
import StatusBadge from "../../components/badges/StatusBadge";
import PageHeader from "../../components/PageHeader";

const API_BASE_URL = process.env.REACT_APP_API_URL;

function ServersPage() {
  var navigate = useNavigate();

  const [servers, setServers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(Date.now());

  const [errors, setErrors] = useState([]);

  useEffect(() => {
  const fetchServers = () => {
    axios
      .get(`${API_BASE_URL}/servers`)
      .then(async (res) => {
        console.log("Response data:", res.data);

        // Fetch all health statuses
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
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
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching servers:", err);
        setLoading(false);
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

          if (row.original.status == "warning") {
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
        "& .MuiSvgIcon-root": {
          fill: "#fff",
          color: "#fff",
        },
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
    mrtTheme: {
      baseBackgroundColor: "#1e1e1e",
    },
    state: {
      isLoading: loading,
    },
    renderRowActionMenuItems: ({ row }) => [
      <MenuItem
        key="ping"
        onClick={() => handlePing(row.original.id)}
        sx={{ m: 0 }}
      >
        <ListItemIcon>
          <SignalCellularAltIcon />
        </ListItemIcon>
        Ping
      </MenuItem>,
      <MenuItem
        key="view_metrics"
        onClick={() => navigate(`/server/metrics/${row.original.id}`)}
        sx={{ m: 0 }}
      >
        <ListItemIcon>
          <AssessmentIcon />
        </ListItemIcon>
        View Metrics
      </MenuItem>,
      <MenuItem
        key="view_events"
        onClick={() => navigate(`/server/events/${row.original.id}`)}
        sx={{ m: 0 }}
      >
        <ListItemIcon>
          <CelebrationIcon />
        </ListItemIcon>
        View Events
      </MenuItem>,
      <MenuItem
        key="edit_server"
        onClick={() => navigate(`/server/edit/${row.original.id}`)}
        sx={{ m: 0 }}
      >
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        Edit Server
      </MenuItem>,
    ],
  });

  const handlePing = (id) => {
    axios
      .post(`${API_BASE_URL}/server/ping/` + id)
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

    axios
      .get(`${API_BASE_URL}/server/status/` + id)
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

  return (
    <Container fluid className="w-75 mt-5">
      <PageHeader header={"Server Monitoring"}/>
      
      <Button variant="secondary" className="text-white mb-2" onClick={() => navigate(`/server/add`)}>Add Server</Button>
      {errors.map((err, index) => {
        return (
          <AlertBadge
            key={index}
            status={err.status}
            message={err.message}
            id={err.id}
            index={index}
          ></AlertBadge>
        );
      })}

      <MaterialReactTable table={table} />
    </Container>
  );
}

export default ServersPage;
