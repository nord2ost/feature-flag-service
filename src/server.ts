import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

// Serve static files from the "public" folder (we'll add index.html here later)
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
