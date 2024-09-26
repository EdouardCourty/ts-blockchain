import { Router } from 'express';

const router = Router();

// GET /healthcheck - Healthcheck endpoint
router.get('/healthcheck', (_, res) => {
    return res.json({ status: 'ok' }).end();
});

export default router;
