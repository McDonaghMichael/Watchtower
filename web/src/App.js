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
import ManageServerEvents from './pages/servers/events/ManageServerEvents';

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
          <Route path="/server/events/:id" element={<ManageServerEvents />} />  

          <Route path="/account/create" element={<CreateAccountPage />} />
          <Route path="/account/edit/:id" element={<EditAccountPage />} />
          

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;