import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { ShieldCheck, Siren, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

// Constants for better maintainability
const APP_NAME = {
  full: 'Lost & Found Community',
  short: 'L&F'
};

const NAVIGATION_LINKS = [
  { href: '/feed', label: 'Feed' },
  { href: '/items/new', label: 'Report' },
  { href: '/announcements', label: 'Announcements' }
];

// NavLink component with consistent styling
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

// Loading state component
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = useCallback(async () => {
    if (logoutLoading) return;
    
    setLogoutLoading(true);
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Could add a toast notification here
    } finally {
      setLogoutLoading(false);
    }
  }, [auth, navigate, logoutLoading]);

  const handleProfileClick = useCallback(() => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  if (loading) {
    return <LoadingHeader />;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center gap-3">
        {/* Logo/Brand */}
        <Link 
          to="/" 
          className="flex items-center gap-2 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <Siren className="h-6 w-6" />
          <span className="hidden sm:inline">{APP_NAME.full}</span>
          <span className="sm:hidden">{APP_NAME.short}</span>
        </Link>

        {/* Navigation Links */}
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {NAVIGATION_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} label={label} />
          ))}
          
          {/* User Actions */}
          {user ? (
            <>
              <Button
                onClick={handleProfileClick}
                variant="ghost"
                size="sm"
                className="gap-2 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
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
