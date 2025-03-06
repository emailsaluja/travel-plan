import React from 'react';
import { Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();

  if (isAuthenticated) {
    return null;
  }

  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Support</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Help Center</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Safety information</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Cancellation options</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Our COVID-19 Response</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Community</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Travel forums</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Travel creators</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Itinerary guidelines</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Community support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">Traveling</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Why Travel</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Explore destinations</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Travel responsibly</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Travel resources</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 tracking-wider uppercase">About</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">How TravelPlanner works</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Newsroom</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Careers</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Investors</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 py-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-4">
            <Globe className="h-5 w-5 text-gray-500" />
            <select className="text-gray-500 bg-transparent border-none focus:ring-0">
              <option>English (US)</option>
              <option>Español</option>
              <option>Français</option>
              <option>日本語</option>
            </select>
            <select className="text-gray-500 bg-transparent border-none focus:ring-0">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>JPY</option>
            </select>
          </div>
          
          <div className="mt-4 md:mt-0 text-center md:text-right">
            <p className="text-gray-500 text-sm">
              © {currentYear} TravelPlanner, Inc. All rights reserved.
            </p>
            <div className="mt-2 flex space-x-6 justify-center md:justify-end">
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 text-sm">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;