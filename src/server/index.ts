import express from 'express';
import cors from 'cors';
import aiItinerariesRouter from './routes/ai-itineraries';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/ai-itineraries', aiItinerariesRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// ... rest of your server setup 