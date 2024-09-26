import { Router } from 'express';
import BlockchainSingleton from '../BlockchainSingleton';
import PeersSingleton from '../PeersSingleton';

const router = Router();

// GET /blocks - Retrieve the entire blockchain
router.get('/', (_, res) => {
    const blockchain = BlockchainSingleton.getInstance();
    res.json({ chain: blockchain.chain });

    return res.end();
});

// GET /blocks/latest - Retrieve the latest block
router.get('/latest', (_, res) => {
    const blockchain = BlockchainSingleton.getInstance();
    const latestBlock = blockchain.getLatestBlock();
    res.json({ block: latestBlock });

    return res.end();
});

// GET /blocks/:index - Retrieve a block by its index
router.get('/:index', (req, res) => {
    const { index } = req.params;
    const blockchain = BlockchainSingleton.getInstance();

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

router.post('/mine', async (req, res) => {
    const { minerAddress } = req.body;

    if (!minerAddress) {
        return res.status(400).json({ error: 'Miner address is required' });
    }

    const blockchain = BlockchainSingleton.getInstance();
    blockchain.minePendingTransactions(minerAddress);

    BlockchainSingleton.saveInstance(); // Save the blockchain after mining

    // Broadcast the new block to all peers
    const newBlock = blockchain.getLatestBlock();
    await PeersSingleton.broadcastNewBlock(newBlock);

    res.json({ message: 'Block mined and broadcasted successfully', block: newBlock });

    return res.end();
});

export default router;
