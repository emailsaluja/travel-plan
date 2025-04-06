import { supabase } from '../lib/supabase';

export interface PurchasedItinerary {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    purchase_date: string;
    duration: number;
    featured_image_url: string;
    gallery_image_urls: string[];
    inclusions: string[];
    exclusions: string[];
    terms_and_conditions: string;
    cancellation_policy: string;
    status: string;
    country: string;
    base_itinerary_id: string;
}

interface PurchaseRecord {
    premium_itineraries: {
        id: string;
        title: string;
        description: string;
        price: number;
        currency: string;
        duration: number;
        featured_image_url: string;
        gallery_image_urls: string[];
        inclusions: string[];
        exclusions: string[];
        terms_and_conditions: string;
        cancellation_policy: string;
        status: string;
        country: string;
        base_itinerary_id: string;
    } | null;
    purchase_date: string;
}

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

    async getPurchasedItineraries(userId: string): Promise<PurchasedItinerary[]> {
        try {
            const { data, error } = await supabase
                .from('premium_itinerary_purchases')
                .select(`
                    premium_itineraries (
                        id,
                        title,
                        description,
                        price,
                        currency,
                        duration,
                        featured_image_url,
                        gallery_image_urls,
                        inclusions,
                        exclusions,
                        terms_and_conditions,
                        cancellation_policy,
                        status,
                        country,
                        base_itinerary_id
                    ),
                    purchase_date
                `)
                .eq('user_id', userId)
                .order('purchase_date', { ascending: false });

            if (error) {
                console.error('Error fetching purchased itineraries:', error);
                return [];
            }

            return (data as unknown as PurchaseRecord[])
                .filter((purchase): purchase is PurchaseRecord & { premium_itineraries: NonNullable<PurchaseRecord['premium_itineraries']> } =>
                    purchase.premium_itineraries !== null
                )
                .map(purchase => ({
                    ...purchase.premium_itineraries,
                    purchase_date: purchase.purchase_date
                }));
        } catch (error) {
            console.error('Error in getPurchasedItineraries:', error);
            return [];
        }
    }
} 