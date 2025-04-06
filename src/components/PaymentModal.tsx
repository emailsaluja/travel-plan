import React, { useEffect, useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../lib/stripe';
import { PaymentService } from '../services/payment.service';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentFormProps {
    clientSecret: string;
    onSuccess: () => void;
    onCancel: () => void;
    itineraryId: string;
    userId: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ clientSecret, onSuccess, onCancel, itineraryId, userId }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const navigate = useNavigate();
    const paymentService = new PaymentService();
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    const recordPurchaseWithRetry = async (itineraryId: string, userId: string, paymentIntentId: string, retries = 0): Promise<boolean> => {
        try {
            const recorded = await paymentService.recordPurchase(itineraryId, userId, paymentIntentId);
            if (recorded) {
                return true;
            }

            if (retries < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return recordPurchaseWithRetry(itineraryId, userId, paymentIntentId, retries + 1);
            }

            return false;
        } catch (err) {
            if (retries < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return recordPurchaseWithRetry(itineraryId, userId, paymentIntentId, retries + 1);
            }
            throw err;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const { error: submitError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
            });

            if (submitError) {
                setError(submitError.message || 'An error occurred');
                setProcessing(false);
                return;
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                try {
                    // Record the purchase with retry mechanism
                    const recorded = await recordPurchaseWithRetry(itineraryId, userId, paymentIntent.id);

                    if (recorded) {
                        onSuccess();
                        // Redirect to purchased itineraries page with success message
                        navigate('/dashboard/purchased-itineraries', {
                            state: {
                                showThankYou: true,
                                message: 'Thank you for your purchase! Your itinerary is now available.'
                            }
                        });
                    } else {
                        // If all retries failed, show a more detailed error message
                        setError(
                            'Payment successful but failed to record purchase after multiple attempts. ' +
                            'Please contact support with this payment ID: ' + paymentIntent.id
                        );
                        // Log the error for monitoring
                        console.error('Failed to record purchase after all retries:', {
                            paymentIntentId: paymentIntent.id,
                            itineraryId,
                            userId
                        });
                    }
                } catch (err) {
                    console.error('Error recording purchase:', err);
                    setError(
                        'Payment successful but failed to record purchase. ' +
                        'Please contact support with this payment ID: ' + paymentIntent.id
                    );
                }
            }
        } catch (err) {
            console.error('Payment confirmation error:', err);
            setError('An unexpected error occurred during payment. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex gap-3 mt-4">
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="flex-1 py-3 bg-[#00C48C] text-white rounded-xl text-sm font-medium hover:bg-[#00B380] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={processing}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    itineraryId: string;
    userId: string;
    onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    itineraryId,
    userId,
    onSuccess,
}) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const paymentService = new PaymentService();

    useEffect(() => {
        if (isOpen) {
            const initializePayment = async () => {
                try {
                    const paymentIntent = await paymentService.createPaymentIntent(itineraryId, userId);
                    if (paymentIntent) {
                        setClientSecret(paymentIntent.clientSecret);
                        setError(null);
                    } else {
                        setError('Failed to initialize payment. Please try again.');
                    }
                } catch (err) {
                    setError('An error occurred while initializing payment.');
                    console.error('Payment initialization error:', err);
                }
            };
            initializePayment();
        }
    }, [isOpen, itineraryId, userId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="relative w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6 border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Complete Purchase</h2>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="p-6 overflow-y-auto flex-grow">
                        {error ? (
                            <div className="text-red-500 text-sm mb-4">{error}</div>
                        ) : clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret }}>
                                <PaymentForm
                                    clientSecret={clientSecret}
                                    onSuccess={onSuccess}
                                    onCancel={onClose}
                                    itineraryId={itineraryId}
                                    userId={userId}
                                />
                            </Elements>
                        ) : (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C48C] mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Initializing payment...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}; 