import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home/Home';
import ServersPage from './pages/servers/ServersPage';
import AddServerPage from './pages/servers/add/AddServerPage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/server/add" element={<AddServerPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;