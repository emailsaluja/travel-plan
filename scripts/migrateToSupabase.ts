import { createClient } from '@supabase/supabase-js';
import { itinerariesData } from '../src/data/itineraries';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  try {
    for (const itinerary of itinerariesData) {
      console.log(`Migrating itinerary: ${itinerary.title}`);
      
      // Insert main itinerary
      const { data: itineraryData, error: itineraryError } = await supabase
        .from('itineraries')
        .insert({
          id: itinerary.id,
          title: itinerary.title,
          description: itinerary.description,
          image_url: itinerary.imageUrl,
          duration: itinerary.duration,
          country: itinerary.country,
          cities: itinerary.cities,
          likes: itinerary.likes,
          tags: itinerary.tags,
          rating: itinerary.rating,
          reviews: itinerary.reviews,
          host: itinerary.host
        })
        .select()
        .single();

      if (itineraryError) throw itineraryError;

      console.log('Migrated main itinerary data');
      
      // Insert destinations and their highlights
      if (itinerary.destinations) {
        for (let i = 0; i < itinerary.destinations.length; i++) {
          const destination = itinerary.destinations[i];
          
          // Insert destination
          const { data: destData, error: destError } = await supabase
            .from('destinations')
            .insert({
              itinerary_id: itinerary.id,
              city: destination.city,
              days: destination.days,
              lat: destination.coordinates.lat,
              lng: destination.coordinates.lng,
              sequence_number: i
            })
            .select();

          if (destError) throw destError;

          // Insert highlights
          for (const highlight of destination.highlights) {
            const { error: highlightError } = await supabase
              .from('destination_highlights')
              .insert({
                destination_id: destData[0].id,
                highlight: highlight
              });

            if (highlightError) throw highlightError;
          }

          // Insert transport details if they exist
          if (destination.transportToNext) {
            const { error: transportError } = await supabase
              .from('transport_details')
              .insert({
                from_destination_id: destData[0].id,
                type: destination.transportToNext.type,
                duration: destination.transportToNext.duration,
                distance: destination.transportToNext.distance,
                description: destination.transportToNext.description
              });

            if (transportError) throw transportError;
          }
        }
      }

      // Insert daily plans
      for (const dayPlan of itinerary.dayByDay) {
        // Insert daily plan
        const { data: planData, error: planError } = await supabase
          .from('daily_plans')
          .insert({
            itinerary_id: itinerary.id,
            day_number: dayPlan.day,
            title: dayPlan.title
          })
          .select();

        if (planError) throw planError;

        // Insert activities
        for (const activity of dayPlan.activities) {
          const { error: activityError } = await supabase
            .from('daily_activities')
            .insert({
              daily_plan_id: planData[0].id,
              activity: activity
            });

          if (activityError) throw activityError;
        }

        // Insert dinner suggestion
        if (dayPlan.dinnerSuggestion) {
          const { error: dinnerError } = await supabase
            .from('dinner_suggestions')
            .insert({
              daily_plan_id: planData[0].id,
              name: dayPlan.dinnerSuggestion.name,
              cuisine: dayPlan.dinnerSuggestion.cuisine,
              description: dayPlan.dinnerSuggestion.description
            });

          if (dinnerError) throw dinnerError;
        }
      }
    }
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrateData(); 