import { Router } from 'express';

import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// GET /sync - Sync blockchain with peers
router.get('/', async (req, res) => {
    const forceReplace = req.body['forceReplace'] || false;

    const updated = await BlockchainLifecycleManager.getInstance().synchronizeWithPeers(forceReplace);

    if (updated) {
        return res.status(200).json({ message: 'Longer chain found, local blockchain updated.' }).end();
    }

    return res.status(304).json({ message: 'No longed chain found.' }).end();
});

export default router;
