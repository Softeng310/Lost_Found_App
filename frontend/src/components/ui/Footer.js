import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

        {/* Product Info */}
          <div className="text-center md:text-right">
            <div className="text-sm text-gray-400 mb-2">
              <span className="font-semibold text-white">Lost & Found Community</span> - Helping University of Auckland students recover lost items
            </div>
          </div>
        {/* Browse items list */}
          <div className="text-center md:text-right">
            <Link to="/feed" className="text-green-400 hover:text-green-300 text-sm transition-colors">
              Browse Items
            </Link>
          </div>

        {/* Contact Info */}
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-green-400" />
              <span>+64 (add a number?)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-green-400" />
              <span>support@lostfound.auckland.ac.nz</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
