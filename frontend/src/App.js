import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/layouts/Layout';
import HomePage from './pages/Home';
import FeedPage from './pages/Feed';
import ProfilePage from './components/ProfilePage';
import ItemDetailPage from './pages/ItemDetail';
import LoginPage from './pages/Login';
import SignUpPage from './pages/SignUp';

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
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;