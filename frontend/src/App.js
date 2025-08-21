import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/layouts/Layout';
import HomePage from './pages/Home';
import FeedPage from './pages/Feed';
import ProfilePage from './pages/ProfilePage';
import ItemDetailPage from './pages/ItemDetail';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/Login';
import SignUpPage from './pages/SignUp';
import AnnouncementsPage from './pages/Announcements';

// Route configuration for better maintainability
const ROUTES = [
  { path: '/', element: HomePage, index: true },
  { path: '/feed', element: FeedPage },
  { path: '/items/:id', element: ItemDetailPage },
  { path: '/profile', element: ProfilePage },
  { path: '/login', element: LoginPage },
  { path: '/signup', element: SignUpPage },
  { path: '/items/new', element: ReportPage },
  { path: '/announcements', element: AnnouncementsPage }
];

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Layout />}>
              {ROUTES.map(({ path, element: Element, index }) => (
                <Route
                  key={path}
                  index={index}
                  path={path}
                  element={<Element />}
                />
              ))}
            </Route>
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;