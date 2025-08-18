import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { Bell, Map, ShieldCheck, Siren, GitBranch } from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import "../App.css";

import PropTypes from "prop-types";

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

NavLink.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.node,
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Siren className="h-5 w-5 text-emerald-600" />
            <span className="hidden sm:inline">{"Lost & Found Community"}</span>
            <span className="sm:hidden">{"L&F"}</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <NavLink href="/dashboard" label="Feed" />
            <NavLink href="/items/new" label="Report" />
            <NavLink href="/map" label="Map" icon={<Map className="h-4 w-4" />} />
            <NavLink href="/stats" label="Stats" />
            <NavLink href="/announcements" label="Notices" icon={<Bell className="h-4 w-4" />} />
            <NavLink href="/admin" label="Admin" />
            <NavLink href="/profile" label="Profile" icon={<ShieldCheck className="h-4 w-4" />} />
            <a href="https://github.com/Softeng310/Lost_Found_App.git" target="_blank" className="ml-1">
              <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                <GitBranch className="h-4 w-4" />
                {"Repo"}
              </Button>
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="mb-4">
            <label htmlFor="login-email" className="block mb-1">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="login-password" className="block mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <Button type="submit" className="w-full mb-4">Login</Button>
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Create Account
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
