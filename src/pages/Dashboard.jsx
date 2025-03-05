import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Auth.module.css';
import { AuthService } from '../services/auth.service';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { user, error } = await AuthService.getCurrentUser();
    if (error || !user) {
      navigate('/signin');
    } else {
      setUser(user);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await AuthService.signOut();
    if (!error) {
      navigate('/signin');
    }
  };

  if (loading) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <p className={styles.message}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.message}>
          Welcome, {user?.user_metadata?.full_name || user?.email}!
        </p>
        <button 
          onClick={handleSignOut} 
          className={styles.button}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Dashboard; 