import React, { useState } from 'react';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddServerPage() {

  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);

  const [showssh_private_key, setShowssh_private_key] = useState(false);
  
  const [formData, setFormData] = useState({
    server_name: '',
    ip_address: '',
    ssh_username: '',
    ssh_private_key: '',
    ssh_port: 22,
    location: '',
    description: '',
    operatingSystem: '',
    environment: 'production',
    monitoring_interval: '5',
    cpu_threshold: '90',
    memory_threshold: '90',
    disk_threshold: '90',
    tags: ''
  });


  const environments = ['production', 'staging', 'development', 'testing'];
  const operatingSystems = ['Ubuntu', 'CentOS', 'Debian', 'RedHat', 'Windows Server', 'Other'];
  
const handleSubmit = (event) => {
  event.preventDefault();

  const submitData = {
    ...formData,
    ssh_port: parseInt(formData.ssh_port, 10),
    monitoring_interval: parseInt(formData.monitoring_interval, 10),
    cpu_threshold: parseInt(formData.cpu_threshold, 10),
    memory_threshold: parseInt(formData.memory_threshold, 10),
    disk_threshold: parseInt(formData.disk_threshold, 10)
  };

  console.log('Sending data:', submitData); 

  axios.post('http://localhost:8080/api/v1/server', submitData)
    .then(res => {
      console.log('Server added successfully:', res.data);
      navigate('/servers');
    })
    .catch(err => {
      console.error('Error adding server:', err);
      alert('Failed to add server. Please try again.');
    });
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Add New Server</h4>
        </Card.Header>
        <Card.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>

            <h5 className="mb-3">Basic Information</h5>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Server Name</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="server_name"
                    value={formData.server_name}
                    onChange={handleInputChange}
                    placeholder="e.g., prod-web-01"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a server name.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>IP Address</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="ip_address"
                    value={formData.ip_address}
                    onChange={handleInputChange}
                    placeholder="e.g., 192.168.1.100"
                    pattern="^(\d{1,3}\.){3}\d{1,3}$"
                  />
                  <Form.Control.Feedback type="invalid">
                    Please provide a valid IP address.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3">SSH Connection Details</h5>
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>SSH Username</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="ssh_username"
                    value={formData.ssh_username}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>SSH Private Key</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      required
                      type={showssh_private_key ? "text" : "ssh_private_key"}
                      name="ssh_private_key"
                      value={formData.ssh_private_key}
                      onChange={handleInputChange}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowssh_private_key(!showssh_private_key)}
                    >
                      <i className={`bi bi-eye${showssh_private_key ? '-slash' : ''}`}></i>
                    </Button>
                  </div>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>SSH Port</Form.Label>
                  <Form.Control
                    required
                    type="number"
                    name="ssh_port"
                    value={formData.ssh_port}
                    onChange={handleInputChange}
                    min="1"
                    max="65535"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3">Server Details</h5>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Operating System</Form.Label>
                  <Form.Select
                    required
                    name="operatingSystem"
                    value={formData.operatingSystem}
                    onChange={handleInputChange}
                  >
                    <option value="">Select OS</option>
                    {operatingSystems.map(os => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Environment</Form.Label>
                  <Form.Select
                    required
                    name="environment"
                    value={formData.environment}
                    onChange={handleInputChange}
                  >
                    {environments.map(env => (
                      <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., US-East, Europe-West"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="e.g., web, database, production"
                  />
                  <Form.Text className="text-muted">
                    Separate tags with commas
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>


            <h5 className="mb-3">Monitoring Settings</h5>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Monitoring Interval (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    name="monitoring_interval"
                    value={formData.monitoring_interval}
                    onChange={handleInputChange}
                    min="1"
                    max="60"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter server description..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <h5 className="mb-3">Alert Thresholds (%)</h5>
            <Row className="mb-4">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>CPU Usage</Form.Label>
                  <Form.Control
                    type="number"
                    name="cpu_threshold"
                    value={formData.cpu_threshold}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Memory Usage</Form.Label>
                  <Form.Control
                    type="number"
                    name="memory_threshold"
                    value={formData.memory_threshold}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Disk Usage</Form.Label>
                  <Form.Control
                    type="number"
                    name="disk_threshold"
                    value={formData.disk_threshold}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary">
                Add Server
              </Button>
              <Button variant="secondary" onClick={() => navigate('/servers')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AddServerPage;