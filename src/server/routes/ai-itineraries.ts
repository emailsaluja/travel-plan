import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Update itinerary
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedItinerary = req.body;

        const result = await prisma.aiItinerary.update({
            where: { id },
            data: updatedItinerary
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating itinerary:', error);
        res.status(500).json({ error: 'Failed to update itinerary' });
    }
});

// Get itinerary by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const itinerary = await prisma.aiItinerary.findUnique({
            where: { id }
        });

        if (!itinerary) {
            return res.status(404).json({ error: 'Itinerary not found' });
        }

        res.json(itinerary);
    } catch (error) {
        console.error('Error fetching itinerary:', error);
        res.status(500).json({ error: 'Failed to fetch itinerary' });
    }
});

export default router; 