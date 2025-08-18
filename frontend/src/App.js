import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/Home';
import FeedPage from './pages/Feed';
import ProfilePage from './components/ProfilePage';
import ItemDetailPage from './pages/ItemDetail';
import ReportPage from './pages/ReportPage';



function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
           <Route path="/items/new" element={<ReportPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;