import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db'; // Adjust this import based on your database setup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const updatedItinerary = req.body;

            // Update the itinerary in your database
            const result = await db.aiItinerary.update({
                where: { id: id as string },
                data: updatedItinerary
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error updating itinerary:', error);
            return res.status(500).json({ error: 'Failed to update itinerary' });
        }
    } else if (req.method === 'GET') {
        try {
            // Get the itinerary from your database
            const itinerary = await db.aiItinerary.findUnique({
                where: { id: id as string }
            });

            if (!itinerary) {
                return res.status(404).json({ error: 'Itinerary not found' });
            }

            return res.status(200).json(itinerary);
        } catch (error) {
            console.error('Error fetching itinerary:', error);
            return res.status(500).json({ error: 'Failed to fetch itinerary' });
        }
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
} 