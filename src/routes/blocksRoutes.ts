import { Router } from 'express';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// GET /blocks - Retrieve the entire blockchain
router.get('/', (_, res) => {
    const blockchain = BlockchainLifecycleManager.getInstance();
    res.json({ chain: blockchain.chain });

    return res.end();
});

// GET /blocks/latest - Retrieve the latest block
router.get('/latest', (_, res) => {
    const blockchain = BlockchainLifecycleManager.getInstance();
    const latestBlock = blockchain.getLatestBlock();

    res.json({ block: latestBlock });

    return res.end();
});

// GET /blocks/:index - Retrieve a block by its index
router.get('/:index', (req, res) => {
    const { index } = req.params;
    const blockchain = BlockchainLifecycleManager.getInstance();

    if (isNaN(Number(index))) {
        return res.status(400).json({ error: 'Invalid block index' }).end();
    }

    const block = blockchain.chain[Number(index)];

    if (block) {
        res.json({ block });
    } else {
        res.status(404).json({ error: 'Block not found' });
    }

    return res.end();
});

export default router;
