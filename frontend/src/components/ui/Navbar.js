import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Map, Shield, GitBranch } from "lucide-react";

const Navbar = () => {

  const navLinkClass = ({ isActive }) =>
    `px-2 py-1 rounded-md hover:bg-green-100 hover:text-green-700 ${
      isActive ? 'bg-green-200 text-green-800' : ''
    }`;

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b">
      {/* Logo + Home link */}
      <NavLink to="/" className="flex items-center space-x-2 ml-4 hover:opacity-80">
        <span className="text-green-600">🚨</span>
        <h1 className="font-bold">Lost &amp; Found Community</h1>
      </NavLink>

      {/* Navigation links */}
      <div className="flex items-center space-x-4 mr-4">
        <NavLink to="/feed" className={navLinkClass}>Feed</NavLink>
        <NavLink to="/report" className={navLinkClass}>Report</NavLink>
        <NavLink to="/map" className={navLinkClass + " flex items-center gap-1"}>
          <Map size={16} /> Map
        </NavLink>
        <NavLink to="/stats" className={navLinkClass}>Stats</NavLink>
        <NavLink to="/notices" className={navLinkClass + " flex items-center gap-1"}>
          <Bell size={16} /> Notices
        </NavLink>
        <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
        <NavLink to="/profile" className={navLinkClass + " flex items-center gap-1"}>
          <Shield size={16} /> Profile
        </NavLink>

        {/* External GitHub repo link */}
        <a
          href="https://github.com/Softeng310/Lost_Found_App"
          target="_blank"
          rel="noopener noreferrer"
          className="border px-3 py-1 rounded-md flex items-center gap-1 hover:bg-green-100 hover:text-green-700"
        >
          <GitBranch size={16} /> Repo
        </a>
      </div>
    </nav>
  );
};

export default Navbar;
