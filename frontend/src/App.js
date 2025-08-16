import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './pages/Home';
import FeedPage from './pages/Feed';
import ItemDetailPage from './pages/ItemDetail';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
