import { createBrowserRouter, Outlet } from 'react-router-dom';
import Navigation1 from './components/Navigation1';
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
import How from './pages/How';
import WhyTravel from './pages/WhyTravel';
import ViewUserItinerary from './pages/ViewUserItinerary';
import UserPublicDashboard from './pages/UserPublicDashboard';
import PublicItineraryView from './pages/PublicItineraryView';
import { CountryImagesAdmin } from './components/CountryImagesAdmin';
import Discover from './pages/Discover';
import LikedTrips from './pages/LikedTrips';
import AdminDashboard from './pages/AdminDashboard';

const RootLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation1 />
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
      { path: 'view-itinerary/:id', element: <ViewUserItinerary /> },
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
      }
    ]
  }
]); 