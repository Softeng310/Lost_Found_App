import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/layouts/Layout';
import HomePage from './pages/Home';
import FeedPage from './pages/Feed';
import ProfilePage from './components/ProfilePage';
import ItemDetailPage from './pages/ItemDetail';
import ReportPage from './pages/ReportPage';


import LoginPage from './pages/Login';
import SignUpPage from './pages/SignUp';
import AnnouncementsPage from './pages/Announcements';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/items/:id" element={<ItemDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/items/new" element={<ReportPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;