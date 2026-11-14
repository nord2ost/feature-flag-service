import express, { Request, Response, NextFunction } from 'express';
import db from './db/database.js';
import flagsRouter from './routes/flags.routes.js';

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use('/api', flagsRouter);

app.get('/api/health', (_req: Request, res: Response) => {
    const row = db.prepare('SELECT COUNT(*) as totalFlags FROM flags').get() as { totalFlags: number };
    res.json({
        status: 'ok',
        database: 'connected',
        totalFlags: row.totalFlags,
        timestamp: new Date().toISOString(),
    });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default app;
