import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { ShieldCheck, Siren, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// App branding - keep these consistent across the app
const APP_NAME = {
  full: 'Lost & Found Community',
  short: 'L&F'
};

// Main navigation links - add new routes here
const NAVIGATION_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/items/new', label: 'Report' },
  { href: '/announcements', label: 'Announcements' }
];

// Reusable nav link component with hover effects
const NavLink = ({ href, label, icon, className = '' }) => {
  return (
    <Link
      to={href}
      className={cn(
        "text-sm rounded-md px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 inline-flex items-center gap-2 font-medium",
        className
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

// Simple loading header while checking auth state
const LoadingHeader = () => (
  <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <div className="container mx-auto px-4 h-16 flex items-center gap-3">
      <Link to="/" className="flex items-center gap-2 font-semibold text-emerald-700">
        <Siren className="h-6 w-6" />
        <span className="hidden sm:inline">{APP_NAME.full}</span>
        <span className="sm:hidden">{APP_NAME.short}</span>
      </Link>
    </div>
  </header>
);

export default function Navigation() {
  // Track current user and loading states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  
  const navigate = useNavigate();
  const auth = getAuth();

  // Listen for auth state changes (login/logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [auth]);

  // Handle user logout with loading state
  const handleLogout = useCallback(async () => {
    if (logoutLoading) return; // Prevent double-clicks
    
    setLogoutLoading(true);
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // TODO: Add toast notification for better UX
    } finally {
      setLogoutLoading(false);
    }
  }, [auth, navigate, logoutLoading]);

  // Navigate to profile or login based on auth state
  const handleProfileClick = useCallback(() => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return <LoadingHeader />;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo and brand - always visible */}
        <Link 
          to="/" 
          className="flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <Siren className="h-6 w-6" />
          <span className="hidden sm:inline">{APP_NAME.full}</span>
          <span className="sm:hidden">{APP_NAME.short}</span>
        </Link>

        {/* Navigation menu - right side */}
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Main nav links */}
          {NAVIGATION_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} />
          ))}
          
          {/* User-specific actions */}
          {user ? (
            <>
              {/* Profile button for logged-in users */}
              <Button
                onClick={handleProfileClick}
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              
              {/* Logout button */}
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                disabled={logoutLoading}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {logoutLoading ? 'Signing out...' : 'Logout'}
                </span>
              </Button>
            </>
          ) : (
            /* Sign in button for guests */
            <Button
              onClick={handleProfileClick}
              variant="ghost"
              size="sm"
              className="gap-2 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
