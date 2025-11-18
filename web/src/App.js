import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home/Home';
import ServersPage from './pages/servers/ServersPage';
import AddServerPage from './pages/servers/add/AddServerPage';
import EditServerPage from './pages/servers/edit/EditServerPage';
import CreateAccountPage from './pages/accounts/create/CreateAccountPage';
import EditAccountPage from './pages/accounts/edit/EditAccountPage';
import ServerMetricsPage from './pages/servers/metrics/ServerMetricsPage';
import CreateServerEvent from './pages/servers/events/create/CreateServerEvent';
import ServerEventsPage from './pages/servers/events/ServerEventsPage';
import EditServerEvent from './pages/servers/events/edit/EditServerEvent';

function App() {

  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/server/add" element={<AddServerPage />} />
          <Route path="/server/edit/:id" element={<EditServerPage />} />
          <Route path="/server/metrics/:id" element={<ServerMetricsPage />} />  
          <Route path="/server/events/:id/" element={<ServerEventsPage />} />  // Show all events for a server
          <Route path="/server/events/:id/create" element={<CreateServerEvent />} /> // Create a new event conditional group for a server
          <Route path="/server/events/:id/edit/:group_id" element={<EditServerEvent />} /> // Edit a conditional group for a server

          <Route path="/account/create" element={<CreateAccountPage />} />
          <Route path="/account/edit/:id" element={<EditAccountPage />} />
          

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;