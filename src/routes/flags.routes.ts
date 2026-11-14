import { Router, Request, Response } from 'express';
import { EventEmitter } from 'node:events';
import db, { FlagRow } from '../db/database.js';
import { createFlagSchema, updateFlagSchema } from '../schemas/flag.schema.js';

const router = Router();
const flagEvents = new EventEmitter();

function formatFlag(row: FlagRow) {
    return {
        id: row.id,
        key: row.key,
        description: row.description,
        enabled: Boolean(row.enabled),
        payload: JSON.parse(row.payload),
        updatedAt: row.updated_at,
    };
}

// NEW: Real-time Server-Sent Events (SSE) stream for connected clients
router.get('/sdk/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send an initial ping so the client knows the stream is connected
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    const onUpdate = () => {
        res.write(`data: ${JSON.stringify({ type: 'config_updated', timestamp: new Date().toISOString() })}\n\n`);
    };

    flagEvents.on('updated', onUpdate);

    // Clean up listener when the client closes the tab or disconnects
    req.on('close', () => {
        flagEvents.off('updated', onUpdate);
    });
});

router.get('/flags', (_req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM flags ORDER BY id ASC').all() as FlagRow[];
    res.json(rows.map(formatFlag));
});

router.get('/sdk/config', (_req: Request, res: Response) => {
    const rows = db.prepare('SELECT * FROM flags').all() as FlagRow[];
    const config: Record<string, { enabled: boolean; payload: Record<string, unknown> }> = {};
    let latestUpdate = '';

    for (const row of rows) {
        config[row.key] = {
            enabled: Boolean(row.enabled),
            payload: JSON.parse(row.payload),
        };
        if (row.updated_at > latestUpdate) {
            latestUpdate = row.updated_at;
        }
    }

    res.json({
        fetchedAt: new Date().toISOString(),
        lastUpdated: latestUpdate || null,
        flags: config,
    });
});

router.post('/flags', (req: Request, res: Response) => {
    const parsed = createFlagSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
    }

    const { key, description, enabled, payload } = parsed.data;
    const existing = db.prepare('SELECT id FROM flags WHERE key = ?').get(key);
    if (existing) {
        res.status(409).json({ error: `Flag with key "${key}" already exists` });
        return;
    }

    const now = new Date().toISOString();
    const result = db
        .prepare('INSERT INTO flags (key, description, enabled, payload, updated_at) VALUES (?, ?, ?, ?, ?)')
        .run(key, description, enabled ? 1 : 0, JSON.stringify(payload), now);

    const created = db.prepare('SELECT * FROM flags WHERE id = ?').get(result.lastInsertRowid) as FlagRow;

    // Notify all connected SSE clients
    flagEvents.emit('updated');

    res.status(201).json(formatFlag(created));
});

router.patch('/flags/:key', (req: Request, res: Response) => {
    const { key } = req.params;
    const existing = db.prepare('SELECT * FROM flags WHERE key = ?').get(key) as FlagRow | undefined;

    if (!existing) {
        res.status(404).json({ error: `Flag "${key}" not found` });
        return;
    }

    const parsed = updateFlagSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
    }

    const nextEnabled = parsed.data.enabled !== undefined ? (parsed.data.enabled ? 1 : 0) : existing.enabled;
    const nextDescription = parsed.data.description ?? existing.description;
    const nextPayload = parsed.data.payload !== undefined ? JSON.stringify(parsed.data.payload) : existing.payload;
    const now = new Date().toISOString();

    db.prepare('UPDATE flags SET enabled = ?, description = ?, payload = ?, updated_at = ? WHERE key = ?')
        .run(nextEnabled, nextDescription, nextPayload, now, key);

    const updated = db.prepare('SELECT * FROM flags WHERE key = ?').get(key) as FlagRow;

    // Notify all connected SSE clients
    flagEvents.emit('updated');

    res.json(formatFlag(updated));
});

router.delete('/flags/:key', (req: Request, res: Response) => {
    const { key } = req.params;
    const result = db.prepare('DELETE FROM flags WHERE key = ?').run(key);

    if (result.changes === 0) {
        res.status(404).json({ error: `Flag "${key}" not found` });
        return;
    }

    // Notify all connected SSE clients
    flagEvents.emit('updated');

    res.status(204).send();
});

export default router;
