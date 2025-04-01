import OpenAI from 'openai';
import { supabase } from '../lib/supabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEEPSEEK_API_KEY = "sk-1eb1c96d9b04410c97a039a9a0f17ab2";

interface AIItineraryRequest {
    country: string;
    duration: number;
    preferences: {
        interests: string[];
        travelStyle: string;
        budget: string;
        pace: string;
    };
}

interface AIItineraryResponse {
    destinations: {
        name: string;
        nights: number;
        description: string;
    }[];
    dailyPlans: {
        day: number;
        activities: {
            time: string;
            activity: string;
            description: string;
            type: string;
        }[];
    }[];
}

export interface SavedAIItinerary {
    id: string;
    user_id: string;
    country: string;
    duration: number;
    preferences: {
        travelStyle: string;
        pace: string;
        interests: string[];
        budget: string;
    };
    trip_name: string;
    destinations: Array<{
        destination: string;
    }>;
    generated_itinerary: {
        destinations: Array<{
            name: string;
            nights: number;
            description: string;
        }>;
        dailyPlans: Array<{
            day: number;
            activities: Array<{
                time: string;
                activity: string;
                description: string;
                type: string;
            }>;
        }>;
    };
    created_at: string;
}

export class AIItineraryService {
    private openai: OpenAI;
    private supabase: SupabaseClient;

    constructor() {
        this.openai = new OpenAI({
            apiKey: DEEPSEEK_API_KEY,
            dangerouslyAllowBrowser: true,
            baseURL: 'https://api.deepseek.com/v1'
        });
        this.supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
        );
    }

    private generatePrompt(request: AIItineraryRequest): string {
        return `Create a detailed travel itinerary for a ${request.duration}-day trip to ${request.country} with the following preferences:
- Interests: ${request.preferences.interests.join(', ')}
- Travel Style: ${request.preferences.travelStyle}
- Budget Level: ${request.preferences.budget}
- Travel Pace: ${request.preferences.pace}

Please provide a structured itinerary that includes:
1. List of destinations to visit with the number of nights in each place
2. Day-by-day schedule with:
   - Morning activities
   - Afternoon activities
   - Evening activities/dinner suggestions
   - Approximate timing for each activity
   - Brief descriptions of each activity/place

Format the response as a JSON object with this structure:
{
  "destinations": [
    {
      "name": "City/Place Name",
      "nights": number,
      "description": "Brief description"
    }
  ],
  "dailyPlans": [
    {
      "day": number,
      "activities": [
        {
          "time": "HH:MM",
          "activity": "Name of activity",
          "description": "Brief description",
          "type": "morning/afternoon/evening"
        }
      ]
    }
  ]
}`;
    }

    public async generateItinerary(request: AIItineraryRequest): Promise<AIItineraryResponse> {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert travel planner with deep knowledge of destinations worldwide. You create detailed, personalized travel itineraries. Your response must be a valid JSON object without any markdown formatting. Keep your responses concise but complete."
                    },
                    {
                        role: "user",
                        content: this.generatePrompt(request)
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            });

            if (!completion.choices[0].message.content) {
                throw new Error('No response from AI service');
            }

            // Clean the response content by removing markdown code block formatting
            let content = completion.choices[0].message.content;
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

            // Ensure the JSON is complete by checking for closing brackets
            if (!content.endsWith('}')) {
                content = content + '}';
            }

            try {
                const response = JSON.parse(content) as AIItineraryResponse;

                // Validate the response structure
                if (!response.destinations || !response.dailyPlans) {
                    throw new Error('Invalid response structure');
                }

                // Save to database
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { error } = await supabase
                        .from('ai_itineraries')
                        .insert({
                            user_id: user.id,
                            country: request.country,
                            duration: request.duration,
                            preferences: request.preferences,
                            trip_name: `${request.duration} Days in ${request.country}`,
                            destinations: response.destinations.map(dest => ({
                                destination: dest.name
                            })),
                            generated_itinerary: response
                        });

                    if (error) {
                        console.error('Error saving AI itinerary:', error);
                        throw error;
                    }
                }

                return response;
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.error('Raw response:', content);
                throw new Error('Failed to parse AI response. Please try again.');
            }
        } catch (error) {
            console.error('Error generating itinerary:', error);
            throw new Error('Failed to generate itinerary. Please try again.');
        }
    }

    async getItineraries(): Promise<SavedAIItinerary[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User not authenticated');
        }

        const { data, error } = await this.supabase
            .from('ai_itineraries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data || [];
    }

    async getItineraryById(id: string): Promise<SavedAIItinerary | null> {
        const { data, error } = await this.supabase
            .from('ai_itineraries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching AI itinerary:', error);
            return null;
        }

        return data;
    }
}

export const aiItineraryService = new AIItineraryService(); 