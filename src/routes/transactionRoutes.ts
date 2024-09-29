import { Router } from 'express';
import Transaction from '../model/Transaction';
import WalletService from '../service/WalletService';
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";

const router = Router();

// POST /transactions - Accept a signed transaction
router.post('/', (req, res) => {
    const { fromAddress, toAddress, amount, signature } = req.body;

    if (!fromAddress || !toAddress || !amount || !signature) {
        return res.status(400).json({ error: 'fromAddress, toAddress, amount, and signature are required' });
    }

    // Reconstruct the transaction
    const transaction = new Transaction(fromAddress, toAddress, amount, 'REGULAR', new Date().toISOString());
    transaction.signature = signature;

    // Verify the transaction using the public key (fromAddress), message (hash), and signature
    const isValidSignature = WalletService.verifySignature(transaction, fromAddress, signature);
    if (!isValidSignature) {
        return res.status(400).json({ error: 'Invalid transaction signature' });
    }

    // Validate the transaction before adding it to the blockchain
    if (!transaction.isValid()) {
        return res.status(400).json({ error: 'Transaction is invalid' });
    }

    try {
        BlockchainLifecycleManager.getInstance().addTransaction(transaction);
        res.json({ message: 'Transaction successfully added to the blockchain', transaction });
    } catch (error: Error | any) {
        res.status(400).json({ error: error.message });
    }

    return res.end();
});

export default router;
