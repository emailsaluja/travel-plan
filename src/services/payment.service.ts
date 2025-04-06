import { supabase } from '../lib/supabase';

export class PaymentService {
    async createPaymentIntent(itineraryId: string, userId: string): Promise<{ clientSecret: string; id: string } | null> {
        try {
            const { data, error } = await supabase.functions.invoke('stripe-webhook', {
                body: {
                    action: 'create-payment-intent',
                    itineraryId,
                    userId
                }
            });

            if (error) {
                console.error('Error creating payment intent:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in createPaymentIntent:', error);
            return null;
        }
    }

    async recordPurchase(itineraryId: string, userId: string, paymentIntentId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('premium_itinerary_purchases')
                .insert({
                    itinerary_id: itineraryId,
                    user_id: userId,
                    purchase_date: new Date().toISOString(),
                    payment_intent_id: paymentIntentId
                });

            if (error) {
                console.error('Error recording purchase:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in recordPurchase:', error);
            return false;
        }
    }
} 