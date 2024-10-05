import { Router } from 'express';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";
import Block from "../model/Block";

const router = Router();

router.post('/', (req, res) => {
    const newBlock = Block.fromJSON(req.body);

    if (BlockchainLifecycleManager.getInstance().getBlockchain().getLatestBlock().hash === newBlock.hash) {
        return res.status(400).json({ error: 'Block already present.' }).end();
    }

    if (!newBlock.isValidProofOfWork(BlockchainLifecycleManager.getInstance().getBlockchain().difficulty)) {
        return res.status(400).json({ error: 'Invalid proof of work' }).end();
    }

    try {
        BlockchainLifecycleManager.getInstance().addBlock(newBlock);
    } catch (error: Error | any) {
        return res.status(400).json({ error: error.message }).end();
    }

    return res.json({
        message: 'Block successfully added to the blockchain',
        block: newBlock
    }).status(201).end();
});

// GET /blocks - Retrieve the entire blockchain
router.get('/', (_, res) => {
    res.json(BlockchainLifecycleManager.getInstance().getBlockchain().chain);

    return res.end();
});

// GET /blocks/latest - Retrieve the latest block
router.get('/latest', (_, res) => {
    const latestBlock = BlockchainLifecycleManager.getInstance().getBlockchain().getLatestBlock();

    res.json({ block: latestBlock });

    return res.end();
});

// GET /blocks/:index - Retrieve a block by its index
router.get('/:index', (req, res) => {
    const { index } = req.params;
    const blockchain = BlockchainLifecycleManager.getInstance().getBlockchain();

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
