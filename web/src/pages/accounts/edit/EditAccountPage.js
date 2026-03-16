import React, { useState, useEffect } from 'react';
import { Container, Form, Card, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../../api/client';
import DisplayCard from '../../../components/notices/DisplayCard';

function EditAccountPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ show: false, status: 'info', title: '', message: '' });

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    department: '',
    phone: '',
    is_active: true,
    permissions: ''
  });

  const [roles, setRoles] = useState([]);
  const departments = ['IT', 'Engineering', 'Operations', 'Security', 'Finance', 'HR'];

  useEffect(() => {
    apiClient.get('/roles').then(res => setRoles(res.data || [])).catch(() => setRoles([]));
    if (id) {
      apiClient.get(`/accounts/${id}`)
        .then(res => {
          console.log('Response data:', res.data);
          if (res.data) {
            setFormData(res.data);
          }
        })
        .catch(err => {
          console.error('Error fetching account:', err);
          setError('Failed to load account data');
        });
    }
  }, [id]);

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

    // Don't send password if it hasn't been changed (empty)
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }

    apiClient.put(`/accounts/${id}`, submitData)
      .then(() => {
        setNotice({ show: true, status: 'success', title: 'Account updated', message: 'The account details have been saved successfully.' });
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to update account. Please try again.';
        console.error('Error updating account:', err);
        setError(msg);
        setNotice({ show: true, status: 'error', title: 'Update failed', message: msg });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <Container className="py-4 w-75">
      <Card className="shadow-lg border-0 bg-dark text-light rounded-4 overflow-hidden">
        <Card.Header className="bg-gradient bg-dark text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Edit Account</h4>
            <small className="text-white-50">
              Update user access, profile, and security.
            </small>
          </div>
          <Button variant="outline-light" onClick={() => navigate('/accounts')}>
            Back
          </Button>
        </Card.Header>
        <Card.Body className="bg-dark">
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form noValidate validated={validated} onSubmit={handleSubmit}>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Account Information</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Username</Form.Label>
                    <Form.Control
                      required
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter username"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a username.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Email Address</Form.Label>
                    <Form.Control
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                    />
                    <Form.Control.Feedback type="invalid">
                      Please provide a valid email address.
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Security</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Password</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Leave blank to keep current password"
                        minLength="6"
                      />
                      <Button 
                        variant="outline-light"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                      </Button>
                    </div>
                    <Form.Text className="text-muted">
                      Leave password blank to keep current password
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Role</Form.Label>
                    <Form.Select
                      required
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Personal Information</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter first name"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter last name"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Department</Form.Label>
                    <Form.Select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>

            <div className="bg-body-secondary bg-opacity-10 rounded-3 p-3 mb-4">
              <h5 className="mb-3 text-light">Account Settings</h5>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-light">Permissions</Form.Label>
                    <Form.Control
                      type="text"
                      name="permissions"
                      value={formData.permissions}
                      onChange={handleInputChange}
                      placeholder="e.g., read,write,execute"
                    />
                    <Form.Text className="text-muted">
                      Separate permissions with commas
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="is_active"
                      label="Account Active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="text-light"
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
                {loading ? 'Updating...' : 'Update Account'}
              </Button>
              <Button 
                variant="outline-light" 
                onClick={() => navigate('/accounts')}
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
        onClose={() => setNotice((prev) => ({ ...prev, show: false }))}
        primaryAction={{ label: 'Back to Accounts', onClick: () => navigate('/accounts') }}
      />
    </Container>
  );
}

export default EditAccountPage;
