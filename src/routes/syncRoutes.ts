import { Router } from 'express';

import Logger from "../service/Logger";
import BlockchainLifecycleManager from "../service/BlockchainLifecycleManager";
import PeerManager from "../service/PeerManager";
import httpClient from "../service/HttpClient";

const router = Router();

// GET /sync - Sync blockchain with peers
router.get('/', async (_, res) => {
    const blockchain = BlockchainLifecycleManager.getInstance().getBlockchain();
    const peers = PeerManager.getInstance().getPeers();
    let longestChain = blockchain.chain;

    for (const peerUrl of peers) {
        try {
            const response = await httpClient.get(`${peerUrl}/blockchain`);
            const peerBlockchain = response.data.chain;

            if (peerBlockchain.length > longestChain.length && blockchain.isChainValid()) {
                longestChain = peerBlockchain;
            }
        } catch (error: Error | any) {
            Logger.error(`Error syncing with peer ${peerUrl}:`, error.message);
        }
    }

    // If a longer valid chain is found, replace the current blockchain
    if (longestChain.length > blockchain.chain.length) {
        blockchain.chain = longestChain;
        BlockchainLifecycleManager.getInstance().saveBlockchain();

        res.json({ message: 'Blockchain synced with peers', chain: blockchain.chain });
    } else {
        res.json({ message: 'Blockchain is already up-to-date', chain: blockchain.chain });
    }

    return res.end();
});

export default router;
