import { Router } from 'express';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// GET /blockchain - Retrieve the blockchain
router.get('/', (_, res) => {
    const blockchain = BlockchainLifecycleManager.getInstance();
    res.json(blockchain);

    return res.end();
});

export default router;
