import BlockchainManager from './service/BlockchainManager';
import Blockchain from './model/Blockchain';

import * as config from '../configuration.json';

// Singleton pattern for the Blockchain
class BlockchainSingleton {
    private static instance: Blockchain;
    private static blockchainManager = new BlockchainManager(config.blockchainFile);

    // Ensure that blockchain is loaded once and only once
    static getInstance(): Blockchain {
        if (!BlockchainSingleton.instance) {
            BlockchainSingleton.instance = BlockchainSingleton.blockchainManager.loadBlockchain();
        }
        return BlockchainSingleton.instance;
    }

    // Save blockchain to the disk whenever necessary
    static saveInstance(): void {
        BlockchainSingleton.blockchainManager.saveBlockchain(BlockchainSingleton.getInstance());
    }
}

export default BlockchainSingleton;
