import React, { useState } from 'react';
import { Heart, Share2, Copy, Edit, ArrowLeft } from 'lucide-react';

// This is a placeholder component that would be used when navigating to a specific itinerary
// In a real application, you would fetch the itinerary data based on the ID from the URL

const ItineraryDetail: React.FC = () => {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  // Mock data for the example
  const itinerary = {
    id: '1',
    title: 'Japan in 14 days',
    duration: 14,
    country: 'Japan',
    cities: ['Tokyo', 'Kyoto', 'Osaka'],
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
    description: 'Experience the best of Japan in two weeks, from the bustling streets of Tokyo to the historic temples of Kyoto.',
    likes: 1245,
    createdAt: '2 months ago',
    author: {
      name: 'Travel Enthusiast',
      profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'
    },
    dayByDay: [
      { 
        day: 1, 
        title: 'Arrive in Tokyo', 
        description: 'Check into your hotel in Shinjuku, one of Tokyo\'s most vibrant districts. After settling in, take a walk around the area to get your bearings. Visit the Tokyo Metropolitan Government Building for free panoramic views of the city. End your day with dinner at one of the many restaurants in Shinjuku.',
        imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80'
      },
      { 
        day: 2, 
        title: 'Tokyo Exploration', 
        description: 'Start your day early at the Tsukiji Outer Market to sample some of the freshest seafood. Then head to Harajuku to experience Japan\'s youth culture and fashion scene. Walk down Takeshita Street and visit Meiji Shrine. In the afternoon, explore Shibuya and don\'t miss the famous Shibuya Crossing. End your day with dinner in the area.',
        imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
      },
      { 
        day: 3, 
        title: 'Historic Tokyo', 
        description: 'Visit Asakusa to see the historic Senso-ji Temple and explore the surrounding traditional area. Take a river cruise on the Sumida River to Odaiba, a futuristic artificial island in Tokyo Bay. Spend the afternoon exploring Odaiba\'s attractions, including TeamLab Borderless digital art museum.',
        imageUrl: 'https://images.unsplash.com/photo-1583400759708-1d7b24707857?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80'
      },
    ],
    comments: [
      { user: 'JapanLover', text: 'This itinerary was perfect for my trip last year!', date: '3 weeks ago' },
      { user: 'TravelBug', text: 'I would recommend adding a day trip to Hakone if possible.', date: '1 month ago' },
      { user: 'Wanderlust', text: 'The recommendations for Tokyo were spot on. Thanks for sharing!', date: '2 months ago' },
    ]
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const copyItinerary = () => {
    alert('Itinerary copied to your account!');
  };

  const shareItinerary = () => {
    alert('Share link copied to clipboard!');
  };

  const editItinerary = () => {
    alert('Navigate to edit page');
  };

  const goBack = () => {
    // In a real app, this would navigate back
    console.log('Go back');
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Back button */}
      <button 
        onClick={goBack}
        className="fixed top-24 left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
      >
        <ArrowLeft className="h-5 w-5 text-gray-700" />
      </button>
      
      {/* Hero image */}
      <div className="relative h-96">
        <img 
          src={itinerary.imageUrl} 
          alt={itinerary.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl font-bold text-white">{itinerary.title}</h1>
          <p className="text-xl text-white mt-2">{itinerary.duration} days - {itinerary.cities.join(', ')}</p>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Action buttons */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <img 
              src={itinerary.author.profilePic} 
              alt={itinerary.author.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{itinerary.author.name}</p>
              <p className="text-sm text-gray-500">Created {itinerary.createdAt}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={toggleLike}
              className={`flex items-center space-x-1 px-3 py-2 rounded-full border ${isLiked ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-gray-300 text-gray-700'}`}
            >
              <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
              <span>Like</span>
            </button>
            
            <button 
              onClick={shareItinerary}
              className="flex items-center space-x-1 px-3 py-2 rounded-full border border-gray-300 text-gray-700"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>
            
            <button 
              onClick={copyItinerary}
              className="flex items-center space-x-1 px-3 py-2 rounded-full border border-gray-300 text-gray-700"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </button>
            
            <button 
              onClick={editItinerary}
              className="flex items-center space-x-1 px-3 py-2 rounded-full bg-rose-500 text-white"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
        
        {/* Description */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">About this itinerary</h2>
          <p className="text-gray-700">{itinerary.description}</p>
        </div>
        
        {/* Day by day */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Day by Day Itinerary</h2>
          
          {itinerary.dayByDay.map((day) => (
            <div key={day.day} className="mb-8 border-b border-gray-200 pb-8">
              <div className="flex items-start">
                <div className="bg-rose-500 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 mt-1">
                  {day.day}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold">{day.title}</h3>
                  <p className="text-gray-700 mt-2">{day.description}</p>
                  
                  {day.imageUrl && (
                    <div className="mt-4">
                      <img 
                        src={day.imageUrl} 
                        alt={`Day ${day.day}: ${day.title}`}
                        className="rounded-lg w-full max-h-80 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comments */}
        <div>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-700 font-medium mb-4"
          >
            <span>{showComments ? 'Hide' : 'Show'} comments ({itinerary.comments.length})</span>
          </button>
          
          {showComments && (
            <div className="space-y-4">
              {itinerary.comments.map((comment, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <p className="font-medium">{comment.user}</p>
                    <p className="text-sm text-gray-500">{comment.date}</p>
                  </div>
                  <p className="mt-1 text-gray-700">{comment.text}</p>
                </div>
              ))}
              
              <div className="mt-6">
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  placeholder="Add a comment..."
                  rows={3}
                ></textarea>
                <button className="mt-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600">
                  Post Comment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItineraryDetail;