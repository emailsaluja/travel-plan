// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from 'npm:stripe@12.0.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
    apiVersion: '2024-11-20'
});

// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

console.log('Stripe Function booted!');

Deno.serve(async (request) => {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
            },
        });
    }

    // Check if it's a webhook event
    const signature = request.headers.get('Stripe-Signature');
    if (signature) {
        // Handle webhook event
        const body = await request.text();
        try {
            const receivedEvent = await stripe.webhooks.constructEventAsync(
                body,
                signature,
                Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET'),
                undefined,
                cryptoProvider
            );
            console.log(`🔔 Event received: ${receivedEvent.id}`);
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        } catch (err) {
            return new Response(err.message, {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
    }

    // Handle payment intent creation
    try {
        const { action, itineraryId, userId } = await request.json();

        if (action !== 'create-payment-intent') {
            throw new Error('Invalid action');
        }

        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
            currency: itinerary.currency?.toLowerCase() || 'usd',
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