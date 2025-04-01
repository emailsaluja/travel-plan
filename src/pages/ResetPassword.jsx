import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Auth.module.css';
import { AuthService } from '../services/auth.service';

const ResetPassword = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.target);
    const email = formData.get('email');

    const { error } = await AuthService.resetPassword(email);

    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <h1 className={styles.title}>Check Your Email</h1>
          <p className={styles.message}>
            We've sent password reset instructions to your email address.
          </p>
          <Link to="/signin" className={styles.link}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Reset Password</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email</label>
            <input
              name="email"
              type="email"
              className={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>
          <button 
            type="submit" 
            className={styles.button}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <Link to="/signin" className={styles.link}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword; 