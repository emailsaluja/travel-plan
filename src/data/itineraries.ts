import { supabase } from '../lib/supabase';
import { Itinerary } from '../types';

export async function getItineraries(country: string | null, filter: string): Promise<Itinerary[]> {
  let query = supabase
    .from('itineraries')
    .select(`
      *,
      destinations (
        *,
        destination_highlights (highlight),
        transport_details (*)
      ),
      daily_plans (
        *,
        daily_activities (activity),
        dinner_suggestions (*)
      )
    `)
    .order('id');

  if (country) {
    query = query.eq('country', country);
  }
  
  if (filter) {
    query = query.contains('tags', [filter]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching itineraries:', error);
    return [];
  }

  console.log('Fetched itineraries:', data);

  // Transform and ensure destinations are sorted
  return data.map((item: any): Itinerary => ({
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    duration: item.duration,
    country: item.country,
    cities: item.cities,
    likes: item.likes,
    createdAt: item.created_at,
    tags: item.tags,
    rating: item.rating,
    reviews: item.reviews,
    host: item.host,
    destinations: (item.destinations || [])
      .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
      .map((dest: any) => ({
        city: dest.city,
        days: dest.days,
        highlights: dest.destination_highlights.map((h: any) => h.highlight),
        coordinates: {
          lat: dest.lat,
          lng: dest.lng
        },
        transportToNext: dest.transport_details?.[0] ? {
          type: dest.transport_details[0].type,
          duration: dest.transport_details[0].duration,
          distance: dest.transport_details[0].distance,
          description: dest.transport_details[0].description
        } : undefined
      })),
    dayByDay: item.daily_plans?.map((plan: any) => ({
      day: plan.day_number,
      title: plan.title,
      activities: plan.daily_activities.map((a: any) => a.activity),
      dinnerSuggestion: plan.dinner_suggestions?.[0] ? {
        name: plan.dinner_suggestions[0].name,
        cuisine: plan.dinner_suggestions[0].cuisine,
        description: plan.dinner_suggestions[0].description
      } : undefined
    }))
  }));
}

export async function getItineraryById(id: string): Promise<Itinerary | undefined> {
  const { data, error } = await supabase
    .from('itineraries')
    .select(`
      *,
      destinations (
        *,
        destination_highlights (highlight),
        transport_details (*)
      ),
      daily_plans (
        *,
        daily_activities (activity),
        dinner_suggestions (*)
      )
    `)
    .eq('id', id)
    .order('sequence_number', { foreignTable: 'destinations' })
    .single();

  if (error || !data) {
    console.error('Error fetching itinerary:', error);
    return undefined;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    imageUrl: data.image_url,
    duration: data.duration,
    country: data.country,
    cities: data.cities,
    likes: data.likes,
    createdAt: data.created_at,
    tags: data.tags,
    rating: data.rating,
    reviews: data.reviews,
    host: data.host,
    destinations: (data.destinations || [])
      .sort((a: any, b: any) => a.sequence_number - b.sequence_number)
      .map((dest: any) => ({
        city: dest.city,
        days: dest.days,
        highlights: dest.destination_highlights.map((h: any) => h.highlight),
        coordinates: {
          lat: dest.lat,
          lng: dest.lng
        },
        transportToNext: dest.transport_details?.[0] ? {
          type: dest.transport_details[0].type,
          duration: dest.transport_details[0].duration,
          distance: dest.transport_details[0].distance,
          description: dest.transport_details[0].description
        } : undefined
      })) || [],
    dayByDay: (data.daily_plans || [])
      .sort((a: any, b: any) => a.day_number - b.day_number)
      .map((plan: any) => ({
        day: plan.day_number,
        title: plan.title,
        activities: plan.daily_activities.map((a: any) => a.activity),
        dinnerSuggestion: plan.dinner_suggestions?.[0] ? {
          name: plan.dinner_suggestions[0].name,
          cuisine: plan.dinner_suggestions[0].cuisine,
          description: plan.dinner_suggestions[0].description
        } : undefined
      })) || []
  };
}