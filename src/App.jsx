import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/Admin" element={<Admin />} />
         <Route path="/" element={<Home />} />
        {/* add routes for /doctors, /treatments, /about, /contact */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
