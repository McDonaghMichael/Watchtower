import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import apiClient from '../../../api/client';
import AlertNotice from '../../../components/notices/AlertNotice';
import DisplayCard from "../../../components/notices/DisplayCard";

function EditServerPage() {

  const navigate = useNavigate();

  const { id } = useParams();
  
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({
    show: false,
    status: "info",
    title: "",
    message: "",
  });

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
      apiClient.get(`/server/${id}`)
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

  const handleSubmit = async (event) => {
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

    try {
      const res = await apiClient.put(`/server/${id}`, submitData);
      console.log('Server updated successfully:', res.data);
      setNotice({
        show: true,
        status: "success",
        title: "Server updated",
        message: "Your server details have been saved.",
      });
    } catch (err) {
      console.error('Error updating server:', err);
      setError('Failed to update server. Please try again.');
      setNotice({
        show: true,
        status: "error",
        title: "Update failed",
        message: err?.response?.data?.error || "We could not update this server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
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
    <Container className="py-4 w-75">
      <Card className="shadow-lg border-0 bg-dark text-light rounded-4 overflow-hidden">
        <Card.Header className="bg-gradient bg-dark text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Edit Server</h4>
            <small className="text-white-50">
              Update connection and metadata for this server.
            </small>
          </div>
          <Button variant="outline-light" onClick={() => navigate('/servers')}>
            Back
          </Button>
        </Card.Header>
        <Card.Body className="bg-dark">
          {error && <Alert variant="danger">{error}</Alert>}
          
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
                      type={showPassword ? "text" : "password"}
                      name="ssh_private_key"
                      value={formData.ssh_private_key}
                      onChange={handleInputChange}
                    />
                    <Button 
                      variant="outline-light"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                    </Button>
                  </div>
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
              <Button
                type="submit"
                variant="info"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Server'}
              </Button>
              <Button
                variant="outline-light"
                onClick={() => navigate('/servers')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      <DisplayCard
        show={notice.show}
        status={notice.status}
        title={notice.title}
        message={notice.message}
        onClose={() => setNotice(prev => ({ ...prev, show: false }))}
        primaryAction={{
          label: "Back to Servers",
          onClick: () => navigate('/servers'),
        }}
      />
    </Container>
  );
}

export default EditServerPage;
