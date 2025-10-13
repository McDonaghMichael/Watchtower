import React from 'react';
import { Container, Table, Badge, ProgressBar } from 'react-bootstrap';
import './ServersPage.css';

function ServersPage() {
  const servers = [
    {
      id: 1,
      name: "Production-Web-01",
      status: "online",
      ip: "192.168.1.100",
      location: "US-East",
      cpu: 75,
      memory: 82,
      disk: 45,
      lastPing: "2 mins ago"
    },
    {
      id: 2,
      name: "DB-Master-01",
      status: "online",
      ip: "192.168.1.101",
      location: "US-West",
      cpu: 45,
      memory: 60,
      disk: 78,
      lastPing: "1 min ago"
    },
    {
      id: 3,
      name: "Cache-Server-01",
      status: "offline",
      ip: "192.168.1.102",
      location: "EU-Central",
      cpu: 0,
      memory: 0,
      disk: 32,
      lastPing: "15 mins ago"
    },
    {
      id: 4,
      name: "App-Server-02",
      status: "warning",
      ip: "192.168.1.103",
      location: "Asia-East",
      cpu: 92,
      memory: 88,
      disk: 95,
      lastPing: "30 secs ago"
    }
  ];

  const getStatusBadge = (status) => {
    const variants = {
      online: 'success',
      offline: 'danger',
      warning: 'warning'
    };
    return (
      <Badge bg={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getProgressVariant = (value) => {
    if (value >= 90) return 'danger';
    if (value >= 75) return 'warning';
    if (value >= 50) return 'info';
    return 'success';
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Server Monitoring</h2>
      <Table responsive hover className="align-middle">
        <thead className="table-dark">
          <tr>
            <th>Server Name</th>
            <th>Status</th>
            <th>IP Address</th>
            <th>Location</th>
            <th>CPU</th>
            <th>Memory</th>
            <th>Disk</th>
            <th>Last Ping</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {servers.map(server => (
            <tr key={server.id}>
              <td>{server.name}</td>
              <td>{getStatusBadge(server.status)}</td>
              <td>{server.ip}</td>
              <td>{server.location}</td>
              <td>
                <div className="metric-container">
                  <small>{server.cpu}%</small>
                  <ProgressBar 
                    now={server.cpu} 
                    variant={getProgressVariant(server.cpu)}
                    style={{ height: '8px' }}
                  />
                </div>
              </td>
              <td>
                <div className="metric-container">
                  <small>{server.memory}%</small>
                  <ProgressBar 
                    now={server.memory} 
                    variant={getProgressVariant(server.memory)}
                    style={{ height: '8px' }}
                  />
                </div>
              </td>
              <td>
                <div className="metric-container">
                  <small>{server.disk}%</small>
                  <ProgressBar 
                    now={server.disk} 
                    variant={getProgressVariant(server.disk)}
                    style={{ height: '8px' }}
                  />
                </div>
              </td>
              <td>{server.lastPing}</td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary">
                    <i className="bi bi-gear-fill"></i>
                  </button>
                  <button className="btn btn-sm btn-outline-danger">
                    <i className="bi bi-power"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

export default ServersPage;