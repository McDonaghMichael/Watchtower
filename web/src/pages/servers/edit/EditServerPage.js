import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

function EditServerPage() {

  const navigate = useNavigate();

  const { id } = useParams();
  
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    server_name: '',
    ip_address: '',
    ssh_username: '',
    ssh_password: '',
    ssh_port: 22,
    location: '',
    description: '',
    operatingSystem: '',
    environment: 'production',
    monitoring_interval: '5',
    cpu_threshold: '90',
    memory_threshold: '90',
    disk_threshold: '90',
    status: 'unknown',
    tags: ''
  });

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:8080/api/v1/server/${id}`)
        .then(res => {
          console.log('Response data:', res.data);
          if (res.data) {
            setFormData({
              ...res.data,
              ssh_port: res.data.ssh_port?.toString() || '22',
              monitoring_interval: res.data.monitoring_interval?.toString() || '5',
              cpu_threshold: res.data.cpu_threshold?.toString() || '90',
              memory_threshold: res.data.memory_threshold?.toString() || '90',
              disk_threshold: res.data.disk_threshold?.toString() || '90'
            });
          }
        })
        .catch(err => {
          console.error('Error fetching server:', err);
          setError('Failed to load server data');
        });
    }
  }, [id]);

  const environments = ['production', 'staging', 'development', 'testing'];
  const operatingSystems = ['Ubuntu', 'CentOS', 'Debian', 'RedHat', 'Windows Server', 'Other'];

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    if (!form.checkValidity()) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setLoading(true);
    setError('');

    const submitData = {
      ...formData,
      ssh_port: parseInt(formData.ssh_port, 10),
      monitoring_interval: parseInt(formData.monitoring_interval, 10),
      cpu_threshold: parseInt(formData.cpu_threshold, 10),
      memory_threshold: parseInt(formData.memory_threshold, 10),
      disk_threshold: parseInt(formData.disk_threshold, 10)
    };

    axios.put(`http://localhost:8080/api/v1/server/${id}`, submitData)
      .then(res => {
        console.log('Server updated successfully:', res.data);
        navigate('/servers');
      })
      .catch(err => {
        console.error('Error updating server:', err);
        setError('Failed to update server. Please try again.');
      })
      .finally(() => {
        setLoading(false);
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
          <h4 className="mb-0">Edit Server</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
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
                  <Form.Label>SSH Password</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      required
                      type={showPassword ? "text" : "password"}
                      name="ssh_password"
                      value={formData.ssh_password}
                      onChange={handleInputChange}
                    />
                    <Button 
                      variant="outline-secondary"
                      type="button"
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
              <Button 
                type="submit" 
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Server'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/servers')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default EditServerPage;