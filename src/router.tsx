import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import EmailConfirmation from './pages/EmailConfirmation';
import Dashboard from './pages/Dashboard';
import { ItineraryDetails } from './pages/ItineraryDetails';
import ProtectedRoute from './components/ProtectedRoute';
import SavedItineraries from './pages/SavedItineraries';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'home', element: <Home /> },
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'email-confirmation', element: <EmailConfirmation /> },
      { 
        path: 'dashboard', 
        element: <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      },
      { path: 'itinerary/:id', element: <ItineraryDetails /> },
      {
        path: 'saved-itineraries',
        element: (
          <ProtectedRoute>
            <SavedItineraries />
          </ProtectedRoute>
        )
      },
      { path: '*', element: <Navigate to="/" replace /> }
    ],
  },
]); 