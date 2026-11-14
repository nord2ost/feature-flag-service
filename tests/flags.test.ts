import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/database.js';

describe('Feature Flag & Remote Config API', () => {
    const testKey = 'test_promo_banner';

    after(() => {
        db.prepare('DELETE FROM flags WHERE key = ?').run(testKey);
    });

    it('GET /api/health returns database status', async () => {
        const res = await request(app).get('/api/health');
        assert.equal(res.status, 200);
        assert.equal(res.body.status, 'ok');
        assert.equal(res.body.database, 'connected');
    });

    it('GET /api/sdk/config returns mobile client flag map', async () => {
        const res = await request(app).get('/api/sdk/config');
        assert.equal(res.status, 200);
        assert.ok(res.body.flags.maintenance_mode);
        assert.equal(typeof res.body.flags.maintenance_mode.enabled, 'boolean');
    });

    it('POST /api/flags creates a valid flag and rejects invalid keys', async () => {
        const invalid = await request(app)
            .post('/api/flags')
            .send({ key: 'Invalid Key!', description: 'Bad format' });
        assert.equal(invalid.status, 400);

        const created = await request(app)
            .post('/api/flags')
            .send({ key: testKey, description: 'Temporary test flag', enabled: true });
        assert.equal(created.status, 201);
        assert.equal(created.body.key, testKey);
        assert.equal(created.body.enabled, true);
    });

    it('PATCH /api/flags/:key toggles flag state', async () => {
        const updated = await request(app)
            .patch(`/api/flags/${testKey}`)
            .send({ enabled: false });
        assert.equal(updated.status, 200);
        assert.equal(updated.body.enabled, false);
    });
    it('DELETE /api/flags/:key blocks deleting core demo flags', async () => {
        const res = await request(app).delete('/api/flags/maintenance_mode');
        assert.equal(res.status, 403);
    });
});
