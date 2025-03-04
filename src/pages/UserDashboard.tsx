import React, { useState } from 'react';
import { User, Settings, LogOut, Plus } from 'lucide-react';

// This is a placeholder component for the user dashboard
// In a real application, you would fetch the user data and their itineraries

const UserDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('myItineraries');
  
  // Mock user data
  const userData = {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    myItineraries: [
      {
        id: '101',
        title: 'My Trip to Japan',
        imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        duration: 14,
        cities: ['Tokyo', 'Kyoto', 'Osaka'],
        createdAt: '1 month ago'
      },
      {
        id: '102',
        title: 'Weekend in Paris',
        imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1473&q=80',
        duration: 3,
        cities: ['Paris'],
        createdAt: '2 weeks ago'
      }
    ],
    savedItineraries: [
      {
        id: '201',
        title: 'Italy in 10 days',
        imageUrl: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80',
        duration: 10,
        cities: ['Rome', 'Florence', 'Venice'],
        author: 'Travel Expert',
        savedAt: '3 weeks ago'
      },
      {
        id: '202',
        title: 'Thailand in 14 days',
        imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
        duration: 14,
        cities: ['Bangkok', 'Chiang Mai', 'Phuket'],
        author: 'Asia Traveler',
        savedAt: '1 month ago'
      }
    ]
  };

  const handleCreateItinerary = () => {
    alert('Navigate to create itinerary page');
  };

  const handleLogout = () => {
    alert('User logged out');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={userData.profilePicture} 
                alt={userData.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold">{userData.name}</h1>
                <p className="text-gray-600">{userData.email}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('myItineraries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'myItineraries'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Itineraries
            </button>
            
            <button
              onClick={() => setActiveTab('savedItineraries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'savedItineraries'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Itineraries
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Profile Settings
            </button>
          </nav>
        </div>
        
        {/* Tab content */}
        {activeTab === 'myItineraries' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">My Itineraries</h2>
              <button 
                onClick={handleCreateItinerary}
                className="flex items-center space-x-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Itinerary</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.myItineraries.map((itinerary) => (
                <div key={itinerary.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <img 
                    src={itinerary.imageUrl} 
                    alt={itinerary.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{itinerary.title}</h3>
                    <p className="text-sm text-gray-500">
                      {itinerary.duration} days - {itinerary.cities.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Created {itinerary.createdAt}</p>
                    <div className="mt-4 flex space-x-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        View
                      </button>
                      <button className="px-3 py-1 text-sm border border-rose-300 text-rose-500 rounded-md hover:bg-rose-50">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'savedItineraries' && (
          <div>
            <h2 className="text-xl font-bold mb-6">Saved Itineraries</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.savedItineraries.map((itinerary) => (
                <div key={itinerary.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <img 
                    src={itinerary.imageUrl} 
                    alt={itinerary.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{itinerary.title}</h3>
                    <p className="text-sm text-gray-500">
                      {itinerary.duration} days - {itinerary.cities.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">By {itinerary.author}</p>
                    <p className="text-xs text-gray-400">Saved {itinerary.savedAt}</p>
                    <div className="mt-4 flex space-x-2">
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        View
                      </button>
                      <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        Copy
                      </button>
                      <button className="px-3 py-1 text-sm border border-rose-300 text-rose-500 rounded-md hover:bg-rose-50">
                        Unsave
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6">Profile Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <img 
                    src={userData.profilePicture} 
                    alt={userData.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                    Change Photo
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  value={userData.name}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input 
                  type="email" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  value={userData.email}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  rows={4}
                  placeholder="Tell us about yourself and your travel preferences..."
                ></textarea>
              </div>
              
              <div>
                <button className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;