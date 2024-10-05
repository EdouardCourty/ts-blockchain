import { Router } from 'express';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// GET /blockchain - Retrieve the blockchain
router.get('/', (_, res) => {
    const blockchain = BlockchainLifecycleManager.getInstance().getBlockchain();
    res.json(blockchain.toJSON());

    return res.end();
});

export default router;
