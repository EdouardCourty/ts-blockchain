import * as fs from 'fs';
import * as path from 'path';

import Blockchain from '../model/Blockchain';
import Logger from './Logger';

class BlockchainPersister {
    private readonly blockchainFilePath: string;

    constructor(blockchainFilePath: string) {
        this.blockchainFilePath = blockchainFilePath;
    }

    // Load the blockchain from the JSON file
    public loadBlockchain(difficulty: number, miningReward: number, blockSize: number): Blockchain {
        if (fs.existsSync(this.blockchainFilePath)) {
            const rawData = fs.readFileSync(this.blockchainFilePath, 'utf8');
            const blockchainData = JSON.parse(rawData);
            blockchainData.difficulty = difficulty;
            blockchainData.miningReward = miningReward;

            const blockchain = Blockchain.fromJSON(blockchainData);

            if (!blockchain.isChainValid()) {
                throw new Error('Blockchain is not valid.');
            }

            return blockchain;
        }

        // If the file doesn't exist, create a new blockchain
        const newBlockchain = new Blockchain(difficulty, miningReward, blockSize);

        this.saveBlockchain(newBlockchain);
        return newBlockchain;
    }

    // Save the blockchain to the JSON file
    public saveBlockchain(blockchain: Blockchain): void {
        const blockchainData = JSON.stringify(blockchain.toJSON(), null, 4); // Pretty print JSON
        const dir = path.dirname(this.blockchainFilePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(this.blockchainFilePath, blockchainData, 'utf8');
        Logger.info('Blockchain saved to file.');
    }
}

export default BlockchainPersister;
