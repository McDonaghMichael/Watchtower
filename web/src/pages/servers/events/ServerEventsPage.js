import React, { useEffect, useMemo, useState } from "react";
import { Container, Badge, Alert, Button } from "react-bootstrap";
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
        <h2 className="mb-4">Server Events</h2>
        <Button variant="info" className="text-white mb-2" onClick={() => navigate(`/server/events/${id}/create`)}>Create Event</Button>
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
    </>
  );
}

export default ServerEventsPage;
