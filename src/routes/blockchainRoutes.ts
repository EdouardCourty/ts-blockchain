import { Router } from 'express';
import BlockchainSingleton from '../BlockchainSingleton';
import Block from "../model/Block";

const router = Router();

// GET /blockchain - Retrieve the blockchain
router.get('/', (_, res) => {
    const blockchain = BlockchainSingleton.getInstance();
    res.json(blockchain);

    return res.end();
});


// POST /blockchain/new-block - Receive and process a new block from a peer
router.post('/new-block', (req, res) => {
    const { block } = req.body;

    if (!block) {
        return res.status(400).json({ error: 'Block is required' }).end();
    }

    const blockchain = BlockchainSingleton.getInstance();

    try {
        blockchain.addBlock(block as Block);
        BlockchainSingleton.saveInstance(); // Save the updated blockchain
        res.json({ message: 'New block added to the blockchain' });
    } catch (error: Error | any) {
        res.status(400).json({ error: error.message });
    }

    return res.end();
});

export default router;
