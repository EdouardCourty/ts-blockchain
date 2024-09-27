import express from 'express';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = express.Router();

router.get('/', (_, res) => {
    res.json({ status: BlockchainLifecycleManager.isMining ? 'mining' : 'idle' });

    return res.end();
});

// Start the mining loop
router.post('/start', (_, res) => {
    BlockchainLifecycleManager.startMiningLoop();

    res.json({ message: 'Mining loop started.' });
    res.end();
});

// Stop the mining loop
router.post('/stop', (_, res) => {
    BlockchainLifecycleManager.stopMiningLoop();

    res.json({ message: 'Mining loop stopped.' });
    res.end();
});


export default router;
