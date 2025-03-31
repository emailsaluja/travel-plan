import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/auth.service';

const Navigation1: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, setIsAuthenticated, userEmail } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setIsAuthenticated(false);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                className="h-8 w-auto"
                src="/images/stippl-logo.svg"
                alt="Stippl"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-[#1e293b] font-medium px-3 py-2 text-[15px]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard#liked"
                  className="text-gray-500 hover:text-[#1e293b] px-3 py-2 text-[15px] font-medium"
                >
                  Liked Trips
                </Link>
                <Link
                  to="/discover"
                  className="text-gray-500 hover:text-[#1e293b] px-3 py-2 text-[15px] font-medium"
                >
                  Discover
                </Link>
                <Link
                  to="/blog"
                  className="text-gray-500 hover:text-[#1e293b] px-3 py-2 text-[15px] font-medium"
                >
                  Blog
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/product"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-[15px] font-medium"
                >
                  Product
                </Link>
                <Link
                  to="/creators"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-[15px] font-medium"
                >
                  Creators
                </Link>
                <Link
                  to="/discover"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-[15px] font-medium"
                >
                  Discover
                </Link>
              </>
            )}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="text-gray-500 hover:text-[#1e293b] px-3 py-2 text-[15px] font-medium"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-[15px] font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#00C48C] hover:bg-[#00B380] text-white rounded-lg px-4 py-2 text-[15px] font-medium transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#1e293b]"
                >
                  Dashboard
                </Link>
                <Link
                  to="/dashboard#liked"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[#1e293b]"
                >
                  Liked Trips
                </Link>
                <Link
                  to="/discover"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[#1e293b]"
                >
                  Discover
                </Link>
                <Link
                  to="/blog"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[#1e293b]"
                >
                  Blog
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-[#1e293b]"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/product"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Product
                </Link>
                <Link
                  to="/creators"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Creators
                </Link>
                <Link
                  to="/discover"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Discover
                </Link>
                <Link
                  to="/signin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-[#00C48C] hover:text-[#00B380] hover:bg-gray-50"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation1; 