import React, { useEffect, useMemo, useState } from "react";
import { Container, Badge, Button, Card, Row, Col } from "react-bootstrap";
import axios from "axios";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { ListItemIcon, MenuItem } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import CelebrationIcon from "@mui/icons-material/Celebration";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import AlertBadge from "../../../components/notices/AlertBadge";
import CustomBadge from "../../../components/badges/CustomBadge";
import EditIcon from '@mui/icons-material/Edit';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function ServerEventsPage() {
  const { id } = useParams("id");

  var navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [errors, setErrors] = useState([]);

  const operatorLabel = {
    "<": "less than",
    ">": "more than",
    "=": "equal to",
    "!=": "not equal to",
    less_than: "less than",
    more_than: "more than",
    equal_to: "equal to",
    not_equal_to: "not equal to",
  };

  const metricLabel = {
    cpu_usage: "CPU (%)",
    memory_allocated: "Memory Allocated",
    memory_allocations: "Memory Allocations",
    memory_usage: "Memory (%)",
    swap_used: "Swap Used",
    swap_total: "Swap Total",
    swap_free: "Swap Free",
    cache_memory: "Cache Memory",
    buffer_memory: "Buffer Memory",
    disk_usage_total: "Disk Total",
    disk_usage_used: "Disk Used",
    disk_usage_free: "Disk Free",
    disk_usage: "Disk Usage (%)",
    ssh_connections: "SSH Connections",
    http_connections: "HTTP Connections",
    https_connections: "HTTPS Connections",
    connections: "Connections",
    uptime_seconds: "Uptime (s)",
  };

 useEffect(() => {
  const fetchGroupsData = async () => {
    try {
      const groupResponse = await axios.get(`${API_BASE_URL}/group/server/${id}`);
      const groups = groupResponse.data;

      const groupsWithData = await Promise.all(
        groups.map(async (group) => {
          const [conditionResponse, actionResponse] = await Promise.all([
            axios.get(`${API_BASE_URL}/condition/group/${group.group_id}`),
            axios.get(`${API_BASE_URL}/action/group/${group.group_id}`)
          ]);

          return {
            ...group,
            conditions: conditionResponse.data,
            actions: actionResponse.data
          };
        })
      );

      console.log(groupsWithData);
      setGroups(groupsWithData);
    } catch (err) {
      console.error(err);
    }
  };

  fetchGroupsData();
}, [id]);


  const columns = useMemo(
    () => [
      {
        header: "Group ID",
        accessorKey: "group_id",
        size: 10,
      },
      {
        header: "Conditions",
        accessorKey: "conditions",
        Cell: ({ cell }) => ((cell.getValue().length > 0) ? <CustomBadge variant={"info"} text={cell.getValue().length} /> : <CustomBadge variant={"secondary"} text={"0"} />)
      },
      {
        header: "Actions",
        accessorKey: "actions",
        Cell: ({ cell }) => ((cell.getValue().length > 0) ? <CustomBadge variant={"info"} text={cell.getValue().length} /> : <CustomBadge variant={"secondary"} text={"0"} />)
      }
    ],
    []
  );

  const totalConditions = groups.reduce(
    (sum, g) => sum + (g.conditions ? g.conditions.length : 0),
    0
  );
  const totalActions = groups.reduce(
    (sum, g) => sum + (g.actions ? g.actions.length : 0),
    0
  );
  const actionBreakdown = groups.flatMap((g) => g.actions || []);
  const popularActions = Array.from(
    actionBreakdown.reduce((map, act) => {
      map.set(act.action, (map.get(act.action) || 0) + 1);
      return map;
    }, new Map())
  ).sort((a, b) => b[1] - a[1]);

  const formatCondition = (cond) => {
    const metric = metricLabel[cond.metric] || cond.metric;
    const op = operatorLabel[cond.operator] || cond.operator;
    return `${metric} ${op} ${cond.value}`;
  };
const table = useMaterialReactTable({
    columns,
    data: groups,
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
      color: "primary",
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
      },
    },
    muiTableBodyRowProps: {
      sx: {
        "&:hover": {
          backgroundColor: "#2d2d2d",
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
        key="Edit Group"
        onClick={() => navigate(`/server/events/${id}/edit/${row.original.group_id}`)}
        sx={{ m: 0, color: "#fff" }}
      >
        <ListItemIcon>
          <EditIcon sx={{ color: "#90caf9" }} />
        </ListItemIcon>
        Edit Group
      </MenuItem>
    ],
  });


  return (
    <>
      <Container fluid className="w-75 mt-5">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 className="mb-1">Server Events</h2>
            <p className="text-muted mb-0">
              Review alert groups, their conditions, and the actions they trigger.
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={() => navigate(`/server/${id}`)}>
              Back to Server
            </Button>
            <Button
              variant="info"
              className="text-white"
              onClick={() => navigate(`/server/events/${id}/create`)}
            >
              Create Event
            </Button>
          </div>
        </div>

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

        <Row className="g-3 mb-4">
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <small className="text-uppercase text-muted">Groups</small>
                <h3 className="mb-0">{groups.length || 0}</h3>
                <p className="text-muted mb-0">Alert groups configured for this server.</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <small className="text-uppercase text-muted">Conditions</small>
                <h3 className="mb-0">{totalConditions}</h3>
                <p className="text-muted mb-0">Active checks that trigger actions.</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <small className="text-uppercase text-muted">Actions</small>
                <h3 className="mb-0">{totalActions}</h3>
                <p className="text-muted mb-1">Responses when conditions match.</p>
                <div className="d-flex flex-wrap gap-2">
                  {popularActions.length === 0 && (
                    <Badge bg="secondary" className="text-uppercase">None</Badge>
                  )}
                  {popularActions.slice(0, 3).map(([action, count]) => (
                    <Badge key={action} bg="info" text="dark">
                      {action.replace("_", " ")} · {count}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Group Overview</h5>
              <small className="text-white-50">Counts for conditions and actions</small>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <MaterialReactTable table={table} />
          </Card.Body>
        </Card>

        <div className="mb-3">
          <h5 className="mb-3">Details</h5>
          {groups.length === 0 && (
            <Card className="shadow-sm">
              <Card.Body>
                <p className="mb-0 text-muted">No event groups yet. Create your first rule to get started.</p>
              </Card.Body>
            </Card>
          )}
          <Row className="g-3">
            {groups.map((group) => (
              <Col md={6} key={group.group_id}>
                <Card className="shadow-sm h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>Group #{group.group_id}</strong>
                      <div className="text-muted small">
                        {group.conditions?.length || 0} conditions · {group.actions?.length || 0} actions
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => navigate(`/server/events/${id}/edit/${group.group_id}`)}
                    >
                      Edit
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="text-uppercase text-muted small mb-1">Conditions</div>
                      {group.conditions && group.conditions.length > 0 ? (
                        <ul className="mb-0">
                          {group.conditions.map((cond) => (
                            <li key={cond.condition_id} className="mb-1">
                              <Badge bg="secondary" className="me-2">
                                #{cond.condition_id || "-"}
                              </Badge>
                              {formatCondition(cond)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">No conditions.</span>
                      )}
                    </div>
                    <div>
                      <div className="text-uppercase text-muted small mb-1">Actions</div>
                      {group.actions && group.actions.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {group.actions.map((act) => (
                            <Badge key={act.action_id} bg="info" text="dark">
                              {act.action.replace("_", " ")} {act.value ? `→ ${act.value}` : ""}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No actions.</span>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </>
  );
}

export default ServerEventsPage;
