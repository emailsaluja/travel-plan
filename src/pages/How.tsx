import React from 'react';
import { Search, Calendar, Map, Heart, Share2, PlusCircle } from 'lucide-react';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";


const How = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white stippl-shadow py-4" : "bg-transparent py-6"
          }`}
      >
        <div className="stippl-container flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                alt="Stippl Logo"
                className="h-8 w-auto"
              />
            </Link>
            <nav className="hidden ml-12 md:flex items-center space-x-8">
              <Link to="#features" className="text-sm font-medium hover:text-stippl-green transition-colors">
                Try App
              </Link>
              <Link to="#how-it-works" className="text-sm font-medium hover:text-stippl-green transition-colors">
                Features
              </Link>
              <Link to="#pricing" className="text-sm font-medium hover:text-stippl-green transition-colors">
                FAQ
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/signin"
              className="hidden md:inline-flex text-sm font-medium text-black hover:text-stippl-green transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/try-for-free"
              className="bg-stippl-green hover:bg-stippl-darkGreen text-white rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
            >
              Try for free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-20 relative overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-no-repeat bg-center bg-cover z-0"
          style={{ backgroundImage: "url('https://www.stippl.io/assets/background_visual-85f87405.svg')" }}
        ></div>
        <div className="absolute left-0 bottom-0 w-1/3 h-2/3 pointer-events-none">
          <motion.div
            className="absolute left-0 bottom-0 w-full h-full bg-contain bg-no-repeat bg-left-bottom opacity-90"
            style={{ backgroundImage: "url('/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png')" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="absolute right-0 bottom-0 w-1/3 h-2/3 pointer-events-none">
          <motion.div
            className="absolute right-0 bottom-0 w-full h-full bg-contain bg-no-repeat bg-right-bottom opacity-90"
            style={{ backgroundImage: "url('/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png')" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
        <div className="stippl-container relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              One travel apps<br />
              <span className="text-stippl-green">to replace them all</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Create the perfect trip with AI, manage your bookings in one place, and get exclusive deals no one else can offer.
              No more switching between apps.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link
                to="/get-started"
                className="inline-flex items-center bg-stippl-green hover:bg-stippl-darkGreen text-white rounded-full px-8 py-4 text-lg font-medium transition-all hover:shadow-lg"
              >
                Get Started for Free
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl stippl-shadow overflow-hidden">
              <img
                src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                alt="Stippl App Interface"
                className="w-full"
              />
            </div>

            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-stippl-green"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding">
        <div className="stippl-container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              From planning,<br />
              <span className="text-stippl-green">to tracking, to reliving</span>
            </h2>
            <p className="text-lg text-gray-600">
              Plan your trips from scratch with AI, book and manage everything in one place, and create shareable memories with friends who joined.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="bg-stippl-lightGreen p-8 rounded-2xl">
              <div className="text-stippl-green font-medium mb-2">Keep everything in one place</div>
              <h3 className="text-2xl font-bold mb-4">Forget messy email inboxes</h3>
              <p className="text-gray-700 mb-6">
                Connect your email to sync all bookings automatically. Or add bookings manually with a simple form.
              </p>
              <div className="flex items-center text-stippl-green font-medium">
                <span>See how it works</span>
                <ArrowRight size={16} className="ml-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl stippl-shadow p-6">
                <div className="w-8 h-8 bg-stippl-purple/10 flex items-center justify-center rounded-full mb-3">
                  <div className="w-3 h-3 bg-stippl-purple rounded-full"></div>
                </div>
                <div className="font-medium mb-2">Explore</div>
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="Explore Feature"
                  className="w-full rounded-lg mt-2"
                />
              </div>

              <div className="bg-white rounded-2xl stippl-shadow p-6">
                <div className="w-8 h-8 bg-stippl-red/10 flex items-center justify-center rounded-full mb-3">
                  <div className="w-3 h-3 bg-stippl-red rounded-full"></div>
                </div>
                <div className="font-medium mb-2">Trips</div>
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="Trips Feature"
                  className="w-full rounded-lg mt-2"
                />
              </div>

              <div className="bg-white rounded-2xl stippl-shadow p-6">
                <div className="w-8 h-8 bg-stippl-yellow/10 flex items-center justify-center rounded-full mb-3">
                  <div className="w-3 h-3 bg-stippl-yellow rounded-full"></div>
                </div>
                <div className="font-medium mb-2">Map</div>
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="Map Feature"
                  className="w-full rounded-lg mt-2"
                />
              </div>

              <div className="bg-white rounded-2xl stippl-shadow p-6">
                <div className="w-8 h-8 bg-stippl-green/10 flex items-center justify-center rounded-full mb-3">
                  <div className="w-3 h-3 bg-stippl-green rounded-full"></div>
                </div>
                <div className="font-medium mb-2">Conversations</div>
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="Conversations Feature"
                  className="w-full rounded-lg mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Planner Section */}
      <section className="section-padding bg-[#F8F6FF]">
        <div className="stippl-container">
          <div className="text-center mb-16">
            <div className="text-stippl-purple inline-block px-4 py-1.5 rounded-full bg-[#F0EBFF] text-sm font-medium mb-4">
              AI TRAVEL PLANNING • NOW AVAILABLE
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your AI travel planner
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience the future of travel planning with AI. Tell us where you want to go, your preferences, budget and duration, and we'll craft the perfect itinerary for you.
            </p>
          </div>

          <div className="mt-12 bg-white rounded-2xl stippl-shadow overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 h-[500px]">
              <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-4">Chat like a friend to create your perfect trip</h3>
                  <div className="space-y-2">
                    <div className="bg-stippl-lightGray rounded-full py-2 px-4 inline-block text-sm">How long should I go for?</div>
                    <div className="bg-stippl-lightGray rounded-full py-2 px-4 inline-block text-sm">Suggest the best restaurant in Rome</div>
                    <div className="bg-stippl-lightGray rounded-full py-2 px-4 inline-block text-sm">What to do on rainy days?</div>
                  </div>
                </div>
                <div>
                  <button className="bg-stippl-purple hover:bg-stippl-purple/90 text-white rounded-full px-5 py-2.5 font-medium transition-colors">
                    Try it now
                  </button>
                </div>
              </div>

              <div className="md:col-span-3 border-l">
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="AI Planner Interface"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding">
        <div className="stippl-container">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Join over half a million travelers on<br />
            their journey to easy trip planning
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl stippl-shadow p-6">
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} fill="#FFB800" color="#FFB800" />
                  ))}
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  "This app is a game changer for travel planning! I was able to organize my entire trip to Europe in minutes. The AI suggestions were spot on!"
                </p>
                <div className="font-medium text-sm">Sarah from Chicago</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trips Section */}
      <section className="section-padding bg-white">
        <div className="stippl-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <h2 className="text-3xl font-bold">
              Featured trips from <span className="text-stippl-green">travel experts</span>
            </h2>
            <p className="text-gray-600 mt-4 md:mt-0 max-w-md">
              Curated by professional travelers who spend thousands of hours finding the best spots. Just copy them to your trips.
            </p>
          </div>

          <div className="flex overflow-x-auto pb-8 space-x-6 scrollbar-none">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[280px] bg-white rounded-2xl stippl-shadow overflow-hidden">
                <div className="relative h-48">
                  <img
                    src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                    alt={`Featured Trip ${i}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium">
                    5 days
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">Weekend in Paris</h3>
                  <p className="text-gray-600 text-sm mb-3">The perfect 5-day trip to discover the city of love</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <img
                        src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                        alt="User"
                        className="w-6 h-6 rounded-full mr-2"
                      />
                      <span>@traveler</span>
                    </div>
                    <div className="text-stippl-green text-sm font-medium">View trip</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute left-0 bottom-0 w-1/3 h-2/3 pointer-events-none">
          <div className="absolute left-0 bottom-0 w-full h-full bg-contain bg-no-repeat bg-left-bottom opacity-90"
            style={{ backgroundImage: "url('/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png')" }}></div>
        </div>
        <div className="absolute right-0 bottom-0 w-1/3 h-2/3 pointer-events-none">
          <div className="absolute right-0 bottom-0 w-full h-full bg-contain bg-no-repeat bg-right-bottom opacity-90"
            style={{ backgroundImage: "url('/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png')" }}></div>
        </div>

        <div className="stippl-container relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start your journey
            </h2>
            <Link
              to="/get-started"
              className="inline-flex items-center bg-stippl-green hover:bg-stippl-darkGreen text-white rounded-full px-8 py-4 text-lg font-medium transition-all hover:shadow-lg mb-8"
            >
              Try for free
            </Link>

            <div className="flex items-center justify-center space-x-4">
              <Link to="#" className="flex items-center justify-center bg-black text-white rounded-lg px-4 py-2.5">
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="App Store"
                  className="h-5 mr-2"
                />
                <div className="flex flex-col items-start">
                  <span className="text-xs">Download on the</span>
                  <span className="text-sm font-medium">App Store</span>
                </div>
              </Link>

              <Link to="#" className="flex items-center justify-center bg-black text-white rounded-lg px-4 py-2.5">
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="Google Play"
                  className="h-5 mr-2"
                />
                <div className="flex flex-col items-start">
                  <span className="text-xs">GET IT ON</span>
                  <span className="text-sm font-medium">Google Play</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-16">
        <div className="stippl-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-1">
              <Link to="/" className="inline-block mb-6">
                <img
                  src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                  alt="Stippl Logo"
                  className="h-8 w-auto"
                />
              </Link>
              <div className="flex space-x-4 mb-6">
                <a href="#" className="text-gray-500 hover:text-stippl-green">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-stippl-green">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-500 hover:text-stippl-green">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Download</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">AI Trip Planner</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Careers</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Blog</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Resources</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Community</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Status</a></li>
                <li><a href="#" className="text-gray-600 hover:text-stippl-green">Webinars</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-4">Download</h3>
              <div className="space-y-4">
                <a href="#" className="flex items-center justify-center bg-black text-white rounded-lg px-4 py-2.5">
                  <img
                    src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                    alt="App Store"
                    className="h-5 mr-2"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs">Download on the</span>
                    <span className="text-sm font-medium">App Store</span>
                  </div>
                </a>

                <a href="#" className="flex items-center justify-center bg-black text-white rounded-lg px-4 py-2.5">
                  <img
                    src="/lovable-uploads/3a19faba-78cc-4457-b76f-20cd51c31b1e.png"
                    alt="Google Play"
                    className="h-5 mr-2"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs">GET IT ON</span>
                    <span className="text-sm font-medium">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Stippl. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default How; 