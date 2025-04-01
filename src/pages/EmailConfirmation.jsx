import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Auth.module.css';

const EmailConfirmation = () => {
  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <h1 className={styles.title}>Confirm Your Email</h1>
        <p className={styles.message}>
          We've sent a confirmation email to your address. Please check your inbox
          and click the confirmation link to activate your account.
        </p>
        <p className={styles.message}>
          Didn't receive the email? Check your spam folder or click below to resend.
        </p>
        <button className={styles.button}>
          Resend Confirmation Email
        </button>
        <Link to="/signin" className={styles.link}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default EmailConfirmation; 