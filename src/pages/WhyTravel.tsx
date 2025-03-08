import React from 'react';
import { Globe, BookOpen, Users, Sparkles, Brain, Camera } from 'lucide-react';

const WhyTravel = () => {
  const reasons = [
    {
      icon: <Brain className="w-12 h-12 text-rose-500" />,
      title: "Personal Growth",
      description: "Travel pushes you out of your comfort zone, builds confidence, and helps you discover new strengths and abilities you didn't know you had."
    },
    {
      icon: <Globe className="w-12 h-12 text-rose-500" />,
      title: "Cultural Understanding",
      description: "Experience different ways of life, traditions, and perspectives. Develop empathy and broaden your worldview through firsthand experiences."
    },
    {
      icon: <BookOpen className="w-12 h-12 text-rose-500" />,
      title: "Education",
      description: "Learn about history, art, and architecture in ways no book can teach. Every destination becomes your classroom."
    },
    {
      icon: <Users className="w-12 h-12 text-rose-500" />,
      title: "Connections",
      description: "Meet people from all walks of life, make lifelong friends, and create meaningful connections across cultures and borders."
    },
    {
      icon: <Sparkles className="w-12 h-12 text-rose-500" />,
      title: "Adventure",
      description: "Create unforgettable memories, experience new adventures, and collect stories that will last a lifetime."
    },
    {
      icon: <Camera className="w-12 h-12 text-rose-500" />,
      title: "Memories",
      description: "Capture beautiful moments, create lasting memories, and build a collection of experiences that enrich your life."
    }
  ];

  const testimonials = [
    {
      quote: "Traveling opened my eyes to new possibilities and changed how I see the world.",
      author: "Sarah M.",
      location: "Adventure Enthusiast"
    },
    {
      quote: "Every journey teaches me something new about myself and the world around me.",
      author: "David L.",
      location: "Cultural Explorer"
    },
    {
      quote: "The connections I've made while traveling have become lifelong friendships.",
      author: "Emma R.",
      location: "Global Nomad"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1488085061387-422e29b40080?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=231&q=80"
            alt="Travel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gray-900 opacity-60"></div>
        </div>
        <div className="relative px-4 py-24 sm:px-6 sm:py-32 lg:py-40 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Why Travel?
            </h1>
            <p className="mt-6 text-xl text-gray-100">
              Discover how traveling can transform your life, broaden your horizons, and create lasting memories.
            </p>
          </div>
        </div>
      </div>

      {/* Reasons Grid */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              The Power of Travel
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Explore the many ways travel enriches your life and expands your world
            </p>
          </div>
          <div className="mt-20 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {reason.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {reason.title}
                </h3>
                <p className="text-gray-600">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-rose-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Traveler Stories
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-sm"
              >
                <p className="text-gray-600 italic mb-6">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  <p className="text-rose-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Ready to Start Your Journey?
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Begin your adventure today and discover the transformative power of travel.
          </p>
          <div className="mt-8">
            <button
              onClick={() => window.location.href = '/create-itinerary'}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-rose-500 hover:bg-rose-600"
            >
              Plan Your Adventure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyTravel; 