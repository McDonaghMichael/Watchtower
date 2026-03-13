import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Card, Badge, Form, Button, Tabs, Tab, Alert } from "react-bootstrap";
import apiClient from "../../../api/client";
import LoadingOverlay from "../../../components/LoadingOverlay";
import { getUser, setAuth } from "../../../utils/auth";

function ProfilePage() {
  const { id: paramId } = useParams();
  const current = getUser();
  const navigate = useNavigate();
  const userId = paramId || current?.id;
  const [account, setAccount] = useState(null);
  const [personal, setPersonal] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    department: "",
    phone: "",
  });
  const [custom, setCustom] = useState({ avatar_url: "", profile_color: "#10a37f" });
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const canManageStatus =
    current?.role === "admin" || (current?.role_permissions || []).includes("manage_accounts");

  const load = () => {
    setLoading(true);
    apiClient
      .get(`/accounts/${userId}`)
      .then((res) => {
        setAccount(res.data);
        setPersonal({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          email: res.data.email || "",
          username: res.data.username || "",
          department: res.data.department || "",
          phone: res.data.phone || "",
        });
        setCustom({
          avatar_url: res.data.avatar_url || "",
          profile_color: res.data.profile_color || res.data.role_color || "#10a37f",
        });
      })
      .catch((err) => setMessage(err.response?.data?.error || "Unable to load profile"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [userId]);

  const updateAccount = (payload, success = "Saved") => {
    setLoading(true);
    apiClient
      .put(`/accounts/${userId}`, payload)
      .then(() => {
        setMessage(success);
        load();
      })
      .catch((err) => setMessage(err.response?.data?.error || "Update failed"))
      .finally(() => setLoading(false));
  };

  const handleSavePersonal = () => {
    updateAccount(personal, "Profile updated");
  };

  const handleSaveCustom = () => {
    updateAccount(custom, "Appearance updated");
    if (String(userId) === String(current?.id)) {
      setAuth(null, { ...current, ...custom });
      window.dispatchEvent(new Event('userUpdated'));
    }
  };

  const handleSavePassword = () => {
    if (!passwords.password) {
      setMessage("Enter a new password");
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setMessage("Passwords do not match");
      return;
    }
    updateAccount({ password: passwords.password }, "Password updated");
    setPasswords({ password: "", confirm: "" });
  };

  if (!userId) {
    return null;
  }

  return (
    <Container className="py-4">
      <LoadingOverlay show={loading} />
      {message && (
        <Alert variant="info" onClose={() => setMessage("")} dismissible>
          {message}
        </Alert>
      )}
      <Row className="g-4">
        <Col md={4}>
          <Card className="shadow-sm border-0">
            <Card.Body className="text-center">
              <div
                className="rounded-circle mx-auto mb-3"
                style={{
                  width: 120,
                  height: 120,
                  background: `linear-gradient(135deg, ${custom.profile_color} 0%, #0a0a0a 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {custom.avatar_url ? (
                  <img
                    src={custom.avatar_url}
                    alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span className="fw-semibold" style={{ color: "#fff", fontSize: 28 }}>
                    {account?.username?.slice(0, 1)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <h5 className="mb-1">{account?.username}</h5>
              <div className="text-muted mb-2">{account?.email}</div>
              {account?.role && (
                <Badge
                  pill
                  style={{
                    background: account.role_color || "#0a0a0a",
                    color: "#fff",
                  }}
                  className="mb-2"
                >
                  {account.role}
                </Badge>
              )}
              <div className="small text-muted">
                Joined {account ? new Date(account.created_at).toLocaleDateString() : ""}
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="mt-3"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm border-0">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">Profile</h5>
                <small className="text-muted">Manage your account</small>
              </div>
            </Card.Header>
            <Card.Body>
              <Tabs defaultActiveKey="overview" className="mb-3">
                <Tab eventKey="overview" title="Overview">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          value={personal.first_name}
                          onChange={(e) => setPersonal((p) => ({ ...p, first_name: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          value={personal.last_name}
                          onChange={(e) => setPersonal((p) => ({ ...p, last_name: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          value={personal.email}
                          onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                          value={personal.username}
                          onChange={(e) => setPersonal((p) => ({ ...p, username: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>Department</Form.Label>
                        <Form.Control
                          value={personal.department}
                          onChange={(e) => setPersonal((p) => ({ ...p, department: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          value={personal.phone}
                          onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="info" onClick={handleSavePersonal}>
                    Save Profile
                  </Button>
                </Tab>

                <Tab eventKey="security" title="Security">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="mb-2">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          value={passwords.password}
                          onChange={(e) => setPasswords((p) => ({ ...p, password: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                        />
                      </Form.Group>
                    </Col>
                    {account && canManageStatus && (
                      <Col md={12}>
                        <Form.Check
                          type="switch"
                          id="account-active"
                          label="Account active"
                          checked={account.is_active}
                          onChange={(e) =>
                            updateAccount({ is_active: e.target.checked }, "Status updated")
                          }
                        />
                      </Col>
                    )}
                  </Row>
                  <Button variant="info" onClick={handleSavePassword}>
                    Update Password
                  </Button>
                </Tab>

                <Tab eventKey="custom" title="Customise">
                  <Row className="g-3">
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Avatar URL</Form.Label>
                        <Form.Control
                          placeholder="https://..."
                          value={custom.avatar_url}
                          onChange={(e) => setCustom((p) => ({ ...p, avatar_url: e.target.value }))}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Profile Accent Colour</Form.Label>
                        <div className="d-flex gap-2 align-items-center">
                          <Form.Control
                            type="color"
                            style={{ width: 80 }}
                            value={custom.profile_color}
                            onChange={(e) =>
                              setCustom((p) => ({ ...p, profile_color: e.target.value }))
                            }
                          />
                          <Form.Control
                            value={custom.profile_color}
                            onChange={(e) =>
                              setCustom((p) => ({ ...p, profile_color: e.target.value }))
                            }
                          />
                        </div>
                      </Form.Group>
                      <Button variant="info" onClick={handleSaveCustom}>
                        Save Appearance
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Card className="border-0 shadow-sm">
                        <Card.Body>
                          <div className="text-muted small mb-2">Preview</div>
                          <div
                            className="p-3 rounded-3 text-white"
                            style={{ background: custom.profile_color }}
                          >
                            <div className="fw-semibold">{account?.username || "User"}</div>
                            <div className="small">{account?.email}</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>


              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ProfilePage;
