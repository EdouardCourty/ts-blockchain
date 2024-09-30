import * as fs from 'fs';
import * as path from 'path';

import Blockchain from '../model/Blockchain';
import Block from '../model/Block';
import Transaction from '../model/Transaction';
import Logger from './Logger';

class BlockchainPersister {
    private readonly blockchainFilePath: string;

    constructor(blockchainFilePath: string) {
        this.blockchainFilePath = blockchainFilePath;
    }

    // Load the blockchain from the JSON file
    public loadBlockchain(difficulty: number, reward: number): Blockchain {
        if (fs.existsSync(this.blockchainFilePath)) {
            const rawData = fs.readFileSync(this.blockchainFilePath, 'utf8');
            const blockchainData = JSON.parse(rawData);

            return BlockchainPersister.parseBlockchain(blockchainData, difficulty, reward);
        }

        // If the file doesn't exist, create a new blockchain
        const newBlockchain = new Blockchain(difficulty, reward);

        this.saveBlockchain(newBlockchain);
        return newBlockchain;
    }

    // Save the blockchain to the JSON file
    public saveBlockchain(blockchain: Blockchain): void {
        const blockchainData = JSON.stringify(blockchain, null, 4); // Pretty print JSON
        const dir = path.dirname(this.blockchainFilePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(this.blockchainFilePath, blockchainData, 'utf8');
        Logger.info('Blockchain saved to file.');
    }

    // Helper function to parse the blockchain from JSON data
    public static parseBlockchain(data: any, difficulty: number, reward: number): Blockchain {
        const blockchain = new Blockchain(difficulty, reward);

        blockchain.chain = data.chain.map((blockData: any) => {
            return Block.fromJSON(blockData);
        });

        blockchain.pendingTransactions = data.pendingTransactions.map((tx: any) => {
            return Transaction.fromJSON(tx);
        });

        blockchain.transactionBuffer = data.transactionBuffer.map((tx: any) => {
            return Transaction.fromJSON(tx);
        });

        return blockchain;
    }
}

export default BlockchainPersister;
