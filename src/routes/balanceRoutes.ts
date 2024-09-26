import { Router } from 'express';
import BlockchainSingleton from '../BlockchainSingleton';

const router = Router();

// GET /balance/:address - Get balance of a particular address
router.get('/:address', (req, res) => {
    const { address } = req.params;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    const blockchain = BlockchainSingleton.getInstance();
    const balance = blockchain.getBalanceOfAddress(address);

    res.json({ balance });

    return res.end();
});

export default router;
