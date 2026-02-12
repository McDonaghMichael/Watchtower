import { useEffect, useState } from "react";
import { Container, Card, Table, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/client";

function AccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/accounts")
      .then((res) => {
        setAccounts(res.data || []);
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Unable to load accounts");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container className="py-4 w-75">
      <Card className="shadow-lg border-0 bg-dark text-light rounded-4 overflow-hidden">
        <Card.Header className="bg-gradient bg-dark text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">Accounts</h4>
            <small className="text-white-50">Manage dashboard and CLI users.</small>
          </div>
          <Button variant="info" onClick={() => navigate("/account/create")}>
            + New Account
          </Button>
        </Card.Header>
        <Card.Body className="bg-dark">
          {error && <Alert variant="danger">{error}</Alert>}
          {!error && (
            <Table striped borderless hover variant="dark" responsive className="mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted">
                      No accounts found.
                    </td>
                  </tr>
                )}
                {accounts.map((acct) => (
                  <tr
                    key={acct.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/account/edit/${acct.id}`)}
                  >
                    <td>{acct.id}</td>
                    <td>{acct.username}</td>
                    <td>{acct.email}</td>
                    <td>{acct.role || "—"}</td>
                    <td>{acct.is_active ? "Active" : "Disabled"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AccountsPage;
