import { Router } from 'express';
import Transaction from '../model/Transaction';
import WalletService from '../service/WalletService';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// POST /transactions - Accept a signed transaction
router.post('/', (req, res) => {
    const transaction = Transaction.fromJSON(req.body);

    if (transaction.type === 'REWARD') {
        return res.status(400).json({ error: 'Reward transactions cannot be broadcasted' });
    }

    transaction.type = 'REGULAR';

    if (transaction.fromAddress === null) {
        return res.status(400).json({ error: 'Transaction has no origin address' });
    }

    // Verify the transaction using the public key (fromAddress), message (hash), and signature
    const isValidSignature = WalletService.verifySignature(transaction, transaction.fromAddress, transaction.signature);
    if (!isValidSignature) {
        return res.status(400).json({ error: 'Invalid transaction signature' });
    }

    // Validate the transaction before adding it to the blockchain
    if (!transaction.isValid()) {
        return res.status(400).json({ error: 'Transaction is invalid' });
    }

    try {
        BlockchainLifecycleManager.getInstance().addTransaction(transaction, !req.body.isBroadcast);

        res.json({ message: 'Transaction successfully added to the blockchain', transaction: transaction.toJSON() });
    } catch (error: Error | any) {
        res.status(400).json({ error: error.message });
    }

    return res.end();
});

export default router;
