import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';

const stripe = new Stripe('sk_test_51RAgb2Q0QMcjqlgynRKEHnleq1dAVtKyp2fj3DUChD7Ef9sHLxxehLNL4imVgBh72xCzLaBnkbo0MvLQi21PQvMD00wSV0Dm3z', {
    apiVersion: '2023-10-16',
});

serve(async (req) => {
    try {
        // Handle CORS
        if (req.method === 'OPTIONS') {
            return new Response('ok', {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                },
            });
        }

        // Get request body
        const { itineraryId, userId } = await req.json();

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // Get itinerary details
        const { data: itinerary, error: itineraryError } = await supabaseClient
            .from('premium_itineraries')
            .select('price, currency')
            .eq('id', itineraryId)
            .single();

        if (itineraryError || !itinerary) {
            throw new Error('Itinerary not found');
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(itinerary.price * 100), // Convert to cents
            currency: itinerary.currency.toLowerCase(),
            metadata: {
                itineraryId,
                userId,
            },
        });

        return new Response(
            JSON.stringify({
                clientSecret: paymentIntent.client_secret,
                id: paymentIntent.id,
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}); 