import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated, setUserEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const message = location.state?.message;
  const returnTo = location.state?.returnTo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await AuthService.signIn(email, password);

      if (error) {
        setError(error.message || 'Failed to sign in');
        return;
      }

      if (!data?.user) {
        setError('No user data received');
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(data.user.email || '');
      navigate(returnTo || '/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - App Showcase - 30% */}
      <div className="w-[30%] bg-[#fcf7ec] border-r border-gray-200 p-8 flex flex-col">
        <img
          src="/images/stippl-logo.svg"
          alt="Stippl"
          className="h-8 mb-12"
        />

        <div className="flex-grow flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-6">
            <span className="text-[#00C48C] block">One travel app</span>
            <span className="text-[#1B3A5B] block">to replace them all</span>
          </h1>

          <div className="flex gap-4 mt-8">
            <a href="#" className="transition-opacity hover:opacity-90">
              <img
                src="/images/app-store-black.svg"
                alt="Download on the App Store"
                className="h-12"
              />
            </a>
            <a href="#" className="transition-opacity hover:opacity-90">
              <img
                src="/images/google-play-black.svg"
                alt="Get it on Google Play"
                className="h-12"
              />
            </a>
          </div>

          {/* App Preview Images */}
          <div className="relative mt-12 flex gap-4">
            <div className="w-1/2 relative">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="h-40 bg-[#E5F0F5] relative">
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5">
                    <span className="text-sm font-medium">€1,754.63</span>
                  </div>
                  <img
                    src="/images/italy-map.png"
                    alt="Italy Map"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#00C48C] flex items-center justify-center text-white text-sm">
                        12/18
                      </div>
                      <span className="text-sm text-gray-600">Nights planned</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Milano</span>
                      <span className="text-sm text-gray-500">2 nights</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Venice</span>
                      <span className="text-sm text-gray-500">3 nights</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-1/2 relative -mt-8">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="h-40 bg-[#E5F0F5] relative">
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5">
                    <span className="text-sm font-medium">€48,80</span>
                  </div>
                  <img
                    src="/images/expenses-chart.png"
                    alt="Expenses Chart"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Average costs per day</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="h-24 w-1/3 bg-[#00C48C] rounded-lg"></div>
                    <div className="h-16 w-1/3 bg-[#FFB800] rounded-lg"></div>
                    <div className="h-12 w-1/3 bg-[#7C3AED] rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form - 70% */}
      <div className="w-[70%] relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full bg-no-repeat bg-cover bg-center opacity-100"
          style={{
            backgroundImage: 'url("https://www.stippl.io/assets/background_visual-85f87405.svg")'
          }}
        ></div>

        {/* Form Container */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-24">
          <div className="w-full max-w-md">
            <h2 className="text-[#1B3A5B] text-3xl font-bold mb-8">
              Login to Stippl.
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <img src="/images/google-icon.svg" alt="" className="w-5 h-5" />
                <span className="text-[15px]">Sign in with Google</span>
              </button>

              <button type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <img src="/images/apple-icon.svg" alt="" className="w-5 h-5" />
                <span className="text-[15px]">Sign in with Apple</span>
              </button>

              <div className="flex items-center gap-3 py-4">
                <div className="flex-grow h-px bg-gray-200"></div>
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-grow h-px bg-gray-200"></div>
              </div>

              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#00C48C] focus:ring-1 focus:ring-[#00C48C] outline-none transition-colors"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#00C48C] focus:ring-1 focus:ring-[#00C48C] outline-none transition-colors"
                  required
                />

                <div className="text-right">
                  <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00C48C] text-white rounded-full py-3 hover:bg-[#00B380] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Login'
                  )}
                </button>

                <p className="text-center text-gray-500">
                  <Link to="/signup" className="text-[#00C48C] hover:text-[#00B380]">
                    Create new account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn; 