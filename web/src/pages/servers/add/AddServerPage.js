import React, { useState } from 'react';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;


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

  axios.post(`${API_BASE_URL}/server`, submitData)
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
    <Container className="py-4 w-75">
      <Card className="shadow-lg border-0 bg-dark text-light rounded-4 overflow-hidden">
        <Card.Header className="bg-gradient bg-dark text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Add New Server</h4>
            <small className="text-white-50">
              Provision a server with connection and environment details.
            </small>
          </div>
          <Button variant="outline-light" onClick={() => navigate('/servers')}>
            Back
          </Button>
        </Card.Header>
        <Card.Body className="bg-dark">
          <Form noValidate validated={validated} onSubmit={handleSubmit}>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Basic Information</h5>
              <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Server Name</Form.Label>
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
                  <Form.Label className="text-light">IP Address</Form.Label>
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
            </div>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">SSH Connection Details</h5>
              <Row className="g-3">
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">SSH Username</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="ssh_username"
                    value={formData.ssh_username}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="mb-3">
                <Form.Label className="text-light">SSH Private Key</Form.Label>
                <div className="input-group">
                  <Form.Control
                    required
                    as="textarea"  
                    rows={6}      
                    name="ssh_private_key"
                    value={formData.ssh_private_key}
                    onChange={handleInputChange}
                    placeholder="Paste your SSH private key here (including -----BEGIN and -----END lines)"
                    style={{ fontFamily: 'monospace' }} 
                  />
                </div>
                <Form.Text className="text-muted">
                  Paste your entire SSH private key including the BEGIN and END lines
                </Form.Text>
              </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">SSH Port</Form.Label>
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
            </div>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Server Details</h5>
              <Row className="g-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="text-light">Operating System</Form.Label>
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
                  <Form.Label className="text-light">Environment</Form.Label>
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
                  <Form.Label className="text-light">Location</Form.Label>
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
                  <Form.Label className="text-light">Tags</Form.Label>
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
            </div>
            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Description</h5>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter server description..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="d-flex gap-2">
              <Button type="submit" variant="info">
                Add Server
              </Button>
              <Button variant="outline-light" onClick={() => navigate('/servers')}>
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
