import { Router } from 'express';

const router = Router();

router.get('/', (_, res) => {
    return res.json({
        node_uuid: process.env.NODE_UUID,
        node_name: process.env.NODE_NAME,
    }).end();
});

// GET /healthcheck - Healthcheck endpoint
router.get('/healthcheck', (_, res) => {
    return res.json({
        status: 'ok',
        uptime: process.uptime(),
    }).end();
});

export default router;
