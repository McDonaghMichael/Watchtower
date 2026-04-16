import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/home/Home";
import ServersPage from "./pages/servers/ServersPage";
import AddServerPage from "./pages/servers/add/AddServerPage";
import EditServerPage from "./pages/servers/edit/EditServerPage";
import CreateAccountPage from "./pages/accounts/create/CreateAccountPage";
import EditAccountPage from "./pages/accounts/edit/EditAccountPage";
import AccountsPage from "./pages/accounts/AccountsPage";
import ProfilePage from "./pages/accounts/profile/ProfilePage";
import ServerMetricsPage from "./pages/servers/metrics/ServerMetricsPage";
import CreateServerEvent from "./pages/servers/events/create/CreateServerEvent";
import ServerEventsPage from "./pages/servers/events/ServerEventsPage";
import EditServerEvent from "./pages/servers/events/edit/EditServerEvent";
import LoginPage from "./pages/auth/login/LoginPage";
import RequireAuth from "./components/RequireAuth";
import { clearAuth } from "./utils/auth";
import { Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeProvider";
import RolesPage from "./pages/roles/RolesPage";
import AuditLogsPage from "./pages/audit/AuditLogsPage";
import BackupsPage from "./pages/backups/BackupsPage";
import SessionsPage from "./pages/sessions/SessionsPage";
import TicketsPage from "./pages/tickets/TicketsPage";

function App() {
  const Logout = () => {
    clearAuth();
    return <Navigate to="/login" replace />;
  };

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Home />
                </RequireAuth>
              }
            />
          <Route
            path="/servers"
            element={
              <RequireAuth>
                <ServersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/server/add"
            element={
              <RequireAuth roles={["admin"]}>
                <AddServerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/server/edit/:id"
            element={
              <RequireAuth roles={["admin"]}>
                <EditServerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/server/metrics/:id"
            element={
              <RequireAuth>
                <ServerMetricsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/server/events/:id/"
            element={
              <RequireAuth>
                <ServerEventsPage />
              </RequireAuth>
            }
          />{" "}
          {/* Show all events for a server */}
          <Route
            path="/server/events/:id/create"
            element={
              <RequireAuth roles={["admin"]}>
                <CreateServerEvent />
              </RequireAuth>
            }
          />{" "}
          {/* Create a new event conditional group for a server */}
          <Route
            path="/server/events/:id/edit/:group_id"
            element={
              <RequireAuth roles={["admin"]}>
                <EditServerEvent />
              </RequireAuth>
            }
          />{" "}
          {/* Edit a conditional group for a server */}
          <Route
            path="/account/create"
            element={
              <RequireAuth roles={["admin"]}>
                <CreateAccountPage />
              </RequireAuth>
            }
          />
            <Route
              path="/accounts"
              element={
                <RequireAuth perms={["manage_accounts"]}>
                  <AccountsPage />
                </RequireAuth>
              }
            />
          <Route
            path="/account/edit/:id"
            element={
              <RequireAuth>
                <EditAccountPage />
              </RequireAuth>
            }
          />
            <Route
              path="/account/:id"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/roles"
              element={
                <RequireAuth perms={["manage_roles"]}>
                  <RolesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <RequireAuth perms={["view_audit_logs"]}>
                  <AuditLogsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/backups"
              element={
                <RequireAuth perms={["backup_read"]}>
                  <BackupsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/sessions"
              element={
                <RequireAuth perms={["manage_sessions"]}>
                  <SessionsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/tickets"
              element={
                <RequireAuth>
                  <TicketsPage />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/logout" element={<Logout />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
