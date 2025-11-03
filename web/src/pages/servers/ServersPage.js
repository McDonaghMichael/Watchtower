import React, { useEffect, useMemo, useState } from 'react';
import { Container, Badge, Alert } from 'react-bootstrap';
import './ServersPage.css';
import axios from 'axios';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import {ListItemIcon, MenuItem} from "@mui/material";
import { useNavigate } from 'react-router-dom';

import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function ServersPage() {

  var navigate = useNavigate();

  const [servers, setServers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(Date.now());

  const [errors, setErrors] = useState([
    
  ]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/servers`)
      .then(res => {
        console.log('Response data:', res.data);

        var test = []
        if(res.data){
          for(const server of res.data){
            if(server.status == "warning"){
              test.push({
                id: server.id,
                status: server.status,
                message: server.message || "No message provided"
              })
            }
          }
        }
        setErrors(test)
        setServers(res.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching servers:', err);
        setLoading(false);
      });
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        size: 50,
      },
      {
        header: 'Server Name',
        accessorKey: 'server_name',
      },
      {
        header: 'IP Address',
        accessorKey: 'ip_address',
      },
      {
        header: 'Status',
        accessorKey: 'status',
        Cell: ({ cell }) => getStatusBadge(cell.getValue()),
      },
      {
        header: 'Operating System',
        accessorKey: 'operating_system',
      },
      {
        header: 'Environment',
        accessorKey: 'environment',
      },
      {
        header: 'Location',
        accessorKey: 'location',
      },
      {
        header: 'CPU Threshold',
        accessorKey: 'cpu_threshold',
        Cell: ({ cell }) => `${cell.getValue()}%`,
      },
      {
        header: 'Memory Threshold',
        accessorKey: 'memory_threshold',
        Cell: ({ cell }) => `${cell.getValue()}%`,
      },
      {
        header: 'Disk Threshold',
        accessorKey: 'disk_threshold',
        Cell: ({ cell }) => `${cell.getValue()}%`,
      },
      {
        header: 'Last Ping',
        accessorKey: 'last_ping',
        Cell: ({ cell, row }) => {
          const value = cell.getValue();

          if(row.original.status == "warning"){
            return (
              <Badge bg={'warning'}>
                WARNING
              </Badge>
            )
          }

          const lastPingTime = new Date(value).getTime();
          const currentMsDifference = currentTime - lastPingTime;
          const seconds = currentMsDifference / 1000;
          return getPingBadge(Math.abs(Math.floor(seconds)));
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
                left: ['mrt-row-expand', 'mrt-row-select'],
                right: ['mrt-row-actions'],
            },
        },
        
        paginationDisplayMode: 'pages',
        positionToolbarAlertBanner: 'bottom',
        muiSearchTextFieldProps: {
            size: 'small',
            variant: 'outlined',
        },
        muiPaginationProps: {
            color: 'primary',
            rowsPerPageOptions: [25, 50, 100],
            shape: 'rounded',
            variant: 'outlined',
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

      axios.post(`${API_BASE_URL}/server/ping/` + id)
      .then(res => {
        console.log('Response data:', res.data);
      setServers(prevServers => 
        prevServers.map(server => 
          server.id === id ? { ...server, last_ping: res.data.ping } : server
        )
      );
      handleStatusCheck(id)
      })
      .catch(err => {
        console.error('Error fetching servers:', err);
      });
    }

    const handleStatusCheck = (id) => {

      setServers(prevServers => 
        prevServers.map(server => 
          server.id === id ? { ...server, status: 'loading'} : server
        )
      );

      axios.get(`${API_BASE_URL}/server/status/` + id)
      .then(res => {
        console.log('Response data:', res.data);
      setServers(prevServers => 
        prevServers.map(server => 
          server.id === id ? { ...server, status: res.data.status } : server
        )
      );
      })
      .catch(err => {
        console.error('Error fetching servers:', err);
      });
    }


  const getStatusBadge = (status) => {
    const variants = {
      online: 'success',
      offline: 'danger',
      warning: 'warning',
      loading: 'secondary'
    };
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  const getPingBadge = (seconds) => {

    if(seconds <= 1){ 
      return (
      <Badge bg={'secondary'}>
        {"Re-establishing connection"}
      </Badge>
    );
  } else if(seconds < 60 && seconds > 1){ 
      return (
      <Badge bg={'secondary'}>
        {seconds + 's' || '0s'}
      </Badge>
    );
  }else if(seconds => 60 && seconds < 900){ 
      return (
      <Badge bg={'info'}>
        {seconds + 's' || '0s'}
      </Badge>
    );
  }else {
    return (
      <Badge bg={'success'}>
        {seconds + 's' || '0s'}
      </Badge>
    )
  }
  };

  return (
    <Container fluid className="w-75 mt-5">
      <h2 className="mb-4">Server Monitoring</h2>
    {errors.map((err, index) => {
      return (
        <Alert key={index} variant={err.status}>
          <strong>{err.id}:</strong> {err.message}
        </Alert>
      );
    })}

      <MaterialReactTable table={table} />
    </Container>
  );
}

export default ServersPage;