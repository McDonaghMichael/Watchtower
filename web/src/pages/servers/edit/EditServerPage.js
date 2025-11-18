import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import AlertNotice from '../../../components/notices/AlertNotice';

const API_BASE_URL = process.env.REACT_APP_API_URL;

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
    ssh_private_key: '',
    ssh_port: 22,
    location: '',
    description: '',
    operating_system: '',
    environment: 'production',
    tags: ''
  });

  useEffect(() => {
    if (id) {
      axios.get(`${API_BASE_URL}/server/${id}`)
        .then(res => {
          console.log('Response data:', res.data);
          if (res.data) {
            setFormData({
              ...res.data,
              ssh_port: res.data.ssh_port?.toString() || '22',
            });
          }
        })
        .catch(err => {
          console.error('Error fetching server:', err);
          setError(err);
        });
    }
  }, [id]);

  const environments = ['production', 'staging', 'development', 'testing'];
  const operating_systems = ['Ubuntu', 'CentOS', 'Debian', 'RedHat', 'Windows Server', 'Other'];

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
    };

    axios.put(`${API_BASE_URL}/server/${id}`, submitData)
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

  if (error) {
    return <AlertNotice error={error} />;
  }
  
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
                  <Form.Label>SSH Private Key</Form.Label>
                  <div className="input-group">
                    <Form.Control
                      required
                      as="textarea"  
                    rows={6}      
                      type={showPassword ? "text" : "password"}
                      name="ssh_private_key"
                      value={formData.ssh_private_key}
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
                    name="operating_system"
                    value={formData.operating_system}
                    onChange={handleInputChange}
                  >
                    <option value="">Select OS</option>
                    {operating_systems.map(os => (
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

            <Row className="mb-4">
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