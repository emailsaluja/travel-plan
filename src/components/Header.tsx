import React, { useState, useRef, useEffect } from 'react';
import { Search, Globe, Menu, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { countries } from '../data/countries';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/auth.service';

interface HeaderProps {
  setSelectedCountry?: (country: string | null) => void;
  isAuthenticated: boolean;
}

const Header: React.FC<HeaderProps> = ({ setSelectedCountry, isAuthenticated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { userEmail, setIsAuthenticated, setUserEmail } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const filteredCountries = countries.filter(country => 
    setSelectedCountry || country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (country: string) => {
    if (setSelectedCountry) {
      setSelectedCountry(country);
    }
    setSearchQuery(country);
    setShowDropdown(false);
  };

  const handleSearchFocus = () => {
    setShowDropdown(true);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = async () => {
    try {
      const { error } = await AuthService.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }
      
      // Clear auth context
      setIsAuthenticated(false);
      setUserEmail(null);
      
      // Close the menu
      setShowUserMenu(false);
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <>
      {/* Email banner */}
      {isAuthenticated && userEmail && (
        <div className="bg-rose-500 text-white py-2 fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-sm font-medium">Logged in as: {userEmail}</span>
          </div>
        </div>
      )}
      
      {/* Add margin-top when banner is shown */}
      <header className={`bg-white border-b border-gray-200 sticky ${isAuthenticated ? 'top-8' : 'top-0'} z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <Globe className="h-8 w-auto text-rose-500" />
                <span className="ml-2 text-xl font-bold text-rose-500">TravelPlanner</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-center">
              <div className="max-w-lg w-full relative" ref={dropdownRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 sm:text-sm"
                    placeholder="Where are you going?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchFocus}
                  />
                </div>
                
                {showDropdown && (
                  <div className="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10 max-h-60 overflow-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleCountrySelect(country)}
                        >
                          {country}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500">No countries found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4" ref={userMenuRef}>
              {isAuthenticated && (
                <span className="text-sm text-gray-700">{userEmail}</span>
              )}
              <button
                className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
                onClick={toggleUserMenu}
              >
                <div className="ml-3 relative flex items-center space-x-2 border border-gray-300 rounded-full p-2">
                  <Menu className="h-4 w-4" />
                  <User className="h-4 w-4" />
                </div>
              </button>
              
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none top-16 right-8">
                  {isAuthenticated ? (
                    <>
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile
                      </Link>
                      <Link to="/my-itineraries" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        My Itineraries
                      </Link>
                      <Link to="/saved-itineraries" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Saved Itineraries
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/signin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign in
                      </Link>
                      <Link to="/signup" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;