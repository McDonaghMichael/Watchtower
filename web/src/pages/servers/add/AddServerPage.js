import React, { useState } from 'react';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function AddServerPage() {

  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    serverName: '',
    ipAddress: '',
    username: '',
    password: '',
    sshPort: '22',
    location: '',
    description: '',
    operatingSystem: '',
    environment: 'production',
    monitoringInterval: '5',
    alertThreshold: {
      cpu: '90',
      memory: '90',
      disk: '90'
    },
    tags: ''
  });

  const environments = ['production', 'staging', 'development', 'testing'];
  const operatingSystems = ['Ubuntu', 'CentOS', 'Debian', 'RedHat', 'Windows Server', 'Other'];
  
  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    if (form.checkValidity() === false) {
      event.stopPropagation();
    } else {
      navigate('/servers');
    }

    setValidated(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('alertThreshold.')) {
      const threshold = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        alertThreshold: {
          ...prev.alertThreshold,
          [threshold]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
                    name="serverName"
                    value={formData.serverName}
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
                    name="ipAddress"
                    value={formData.ipAddress}
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
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    required
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      required
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
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
                    name="sshPort"
                    value={formData.sshPort}
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
                    name="monitoringInterval"
                    value={formData.monitoringInterval}
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
                    name="alertThreshold.cpu"
                    value={formData.alertThreshold.cpu}
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
                    name="alertThreshold.memory"
                    value={formData.alertThreshold.memory}
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
                    name="alertThreshold.disk"
                    value={formData.alertThreshold.disk}
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