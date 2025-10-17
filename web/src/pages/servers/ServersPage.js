import React, { useEffect, useMemo, useState } from 'react';
import { Container, Badge } from 'react-bootstrap';
import './ServersPage.css';
import axios from 'axios';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

function ServersPage() {
  
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    axios.get('http://localhost:8080/api/v1/servers')
      .then(res => {
        console.log('Response data:', res.data);
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
        Cell: ({ cell }) => {
          const value = cell.getValue();

          const lastPingTime = new Date(value).getTime();
          const currentMsDifference = currentTime - lastPingTime;
          const seconds = currentMsDifference / 1000;
          return getPingBadge(Math.floor(seconds));
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
    enableRowSelection: true,
    enableColumnOrdering: true,
    enableGlobalFilter: true,
    state: {
      isLoading: loading,
    },
  });

  const getStatusBadge = (status) => {
    const variants = {
      online: 'success',
      offline: 'danger',
      warning: 'warning'
    };
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  const getPingBadge = (seconds) => {

    if(seconds < 60){ 
      return (
      <Badge bg={'danger'}>
        {seconds + 's' || '0s'}
      </Badge>
    );
  }else if(seconds => 60 && seconds < 900){ 
      return (
      <Badge bg={'warning'}>
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
    <Container fluid className="py-4">
      <h2 className="mb-4">Server Monitoring</h2>
      <MaterialReactTable table={table} />
    </Container>
  );
}

export default ServersPage;