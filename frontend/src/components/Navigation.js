import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import {ShieldCheck, Siren, User, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

function NavLink({ href, label, icon }) {
  return (
    <Link
      to={href}
      className={cn(
        "text-sm rounded-md px-2 py-1 hover:bg-emerald-50 transition-colors inline-flex items-center gap-1"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export default function Navigation() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Siren className="h-5 w-5 text-emerald-600" />
            <span className="hidden sm:inline">{"Lost & Found Community"}</span>
            <span className="sm:hidden">{"L&F"}</span>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="container mx-auto px-4 h-14 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Siren className="h-5 w-5 text-emerald-600" />
          <span className="hidden sm:inline">{"Lost & Found Community"}</span>
          <span className="sm:hidden">{"L&F"}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          <NavLink href="/feed" label="Feed" />
          <NavLink href="/items/new" label="Report" />
          <NavLink href="/announcements" label="Announcements" />
          
          {user ? (
  <>
    <Button
      onClick={handleProfileClick}
      variant="ghost"
      size="sm"
      className="gap-1"
    >
      <User className="h-4 w-4" />
      Profile
    </Button>
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="gap-1"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  </>
) : (
  <Button
    onClick={handleProfileClick}
    variant="ghost"
    size="sm"
    className="gap-1"
  >
    <ShieldCheck className="h-4 w-4" />
    Sign In
  </Button>
)}
        </nav>
      </div>
    </header>
  );
}
