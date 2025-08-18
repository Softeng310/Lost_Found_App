import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReportPage from './Pages/ReportPage';



function App() {
  return (
    <Router>
      <div className="p-4">
        <Routes>
          <Route path="/items/new" element={<ReportPage />} />
          <Route path="/" element={<p>Welcome to the homepage! 🏠</p>} />
          <Route path="/items" element={<p>View lost and found items!</p>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
