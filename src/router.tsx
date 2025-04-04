import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import Navigation1 from './components/Navigation1';
import TopNavigation from './components/TopNavigation';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import Dashboard from './pages/Dashboard';
import { ItineraryDetails } from './pages/ItineraryDetails';
import ProtectedRoute from './components/ProtectedRoute';
import SavedItineraries from './pages/SavedItineraries';
import MyItineraries from './pages/MyItineraries';
import CreateItinerary from './pages/CreateItinerary';
import CreateAIItinerary from './pages/CreateAIItinerary';
import How from './pages/How';
import WhyTravel from './pages/WhyTravel';
import ViewUserItinerary from './pages/ViewUserItinerary';
import UserPublicDashboard from './pages/UserPublicDashboard';
import PublicItineraryView from './pages/PublicItineraryView';
import { CountryImagesAdmin } from './components/CountryImagesAdmin';
import { DiscoverSectionAdmin } from './components/DiscoverSectionAdmin';
import Discover from './pages/Discover';
import LikedTrips from './pages/LikedTrips';
import AdminDashboard from './pages/AdminDashboard';
import OnceInLife from './pages/discover/OnceInLife';
import ViewMyItinerary from './pages/ViewMyItinerary';
import AllItineraries from './pages/AllItineraries';
import TripPreparations from './pages/TripPreparations';
import BlogPost from './pages/BlogPost';
import BlogList from './pages/BlogList';
import { useLocation } from 'react-router-dom';
import ViewAIItinerary from './pages/ViewAIItinerary';

const RootLayout = () => {
  const location = useLocation();
  const useTopNav = ['/discover', '/create-itinerary', '/create-ai-itinerary'].some(path =>
    location.pathname.startsWith(path)
  );

  return (
    <div className="flex flex-col min-h-screen">
      {useTopNav ? <TopNavigation /> : <Navigation1 />}
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'email-confirmation', element: <EmailConfirmation /> },
      { path: 'how', element: <How /> },
      { path: 'whytravel', element: <WhyTravel /> },
      { path: 'discover', element: <Discover /> },
      { path: 'discover/:country', element: <Discover /> },
      { path: 'discover/onceinlife', element: <OnceInLife /> },
      { path: 'view-itinerary/:id', element: <ViewUserItinerary /> },
      { path: 'view-ai-itinerary/:id', element: <ViewAIItinerary /> },
      { path: 'viewmyitinerary/:id', element: <ViewMyItinerary /> },
      { path: 'itineraries', element: <AllItineraries /> },
      { path: 'blog', element: <BlogList /> },
      { path: 'blog/:slug', element: <BlogPost /> },
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: 'saved-itineraries',
        element: <ProtectedRoute><SavedItineraries /></ProtectedRoute>
      },
      {
        path: 'liked-trips',
        element: <ProtectedRoute><LikedTrips /></ProtectedRoute>
      },
      {
        path: 'create-itinerary',
        element: <ProtectedRoute><CreateItinerary /></ProtectedRoute>
      },
      {
        path: 'admin/country-images',
        element: <ProtectedRoute><CountryImagesAdmin /></ProtectedRoute>
      },
      {
        path: 'admin/discover-sections',
        element: <ProtectedRoute><DiscoverSectionAdmin /></ProtectedRoute>
      },
      {
        path: 'admin',
        element: <ProtectedRoute><AdminDashboard /></ProtectedRoute>
      },
      {
        path: ':username',
        element: <UserPublicDashboard />
      },
      {
        path: ':username/trips/:id',
        element: <PublicItineraryView />
      },
      {
        path: 'preparations/:id',
        element: <TripPreparations />
      },
      {
        path: "/create-ai-itinerary",
        element: (
          <ProtectedRoute>
            <CreateAIItinerary />
          </ProtectedRoute>
        ),
      },
    ]
  }
]); 