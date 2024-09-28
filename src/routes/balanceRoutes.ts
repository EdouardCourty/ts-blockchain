import { Router } from 'express';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// GET /balance/:address - Get balance of a particular address
router.get('/:address', (req, res) => {
    const { address } = req.params;

    if (!address) {
        return res.status(400).json({ error: 'Address is required' });
    }

    const blockchain = BlockchainLifecycleManager.getInstance().getBlockchain();
    const balance = blockchain.getBalanceOfAddress(address);

    res.json({ balance });

    return res.end();
});

export default router;
