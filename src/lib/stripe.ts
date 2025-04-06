import { loadStripe } from '@stripe/stripe-js';

// Replace with your publishable key
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing Stripe publishable key. Please add VITE_STRIPE_PUBLISHABLE_KEY to your .env file.');
}

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY); 