import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, Siren, User, Search } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const Footer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleBrowseClick = (e) => {
    e.preventDefault();
    navigate('/feed');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const handleAccountClick = (e) => {
    e.preventDefault();
    const accountLink = isLoggedIn ? '/profile' : '/login';
    navigate(accountLink);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const accountLink = isLoggedIn ? '/profile' : '/login';

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">

        {/* Product Info */}
          <div className="text-center md:text-right">
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
              <Siren className="h-6 w-6 text-green-400" />
              <span className="font-semibold text-white">Lost & Found Community</span>
            </div>
          </div>
        {/* Browse items list */}
          <div className="text-center md:text-right">
            <Link 
              to="/feed" 
              onClick={handleBrowseClick}
              className="flex items-center space-x-2 text-green-400 hover:text-green-300 text-sm transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hover:underline">Browse Items</span>
            </Link>
          </div>

        {/* My Account Button */}
          <div className="text-center md:text-right">
            <Link 
              to={accountLink}
              onClick={handleAccountClick}
              className="flex items-center space-x-2 text-green-400 hover:text-green-300 text-sm transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hover:underline">My Account</span>
            </Link>
          </div>

        {/* Contact Info */}
          <div className="flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-green-400" />
              <span>+64 23 456 789</span>
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
