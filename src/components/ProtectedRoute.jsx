import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { session } = await AuthService.getCurrentSession();
    if (!session) {
      navigate('/signin');
    } else {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return children;
};

export default ProtectedRoute; 