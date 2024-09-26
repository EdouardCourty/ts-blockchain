import * as fs from 'fs';
import * as path from 'path';

import Transaction from '../model/Transaction';
import Block from '../model/Block';
import Blockchain from '../model/Blockchain';
import Logger from "./Logger";

class BlockchainManager {
    private readonly blockchainFilePath: string;

    constructor(blockchainFilePath: string) {
        this.blockchainFilePath = blockchainFilePath;
    }

    // Load the blockchain from the JSON file
    loadBlockchain(): Blockchain {
        if (fs.existsSync(this.blockchainFilePath)) {
            const rawData = fs.readFileSync(this.blockchainFilePath, 'utf8');
            const blockchainData = JSON.parse(rawData);

            return this.parseBlockchain(blockchainData);
        } else {
            // If the file doesn't exist, create a new blockchain
            return new Blockchain();
        }
    }

    // Save the blockchain to the JSON file
    saveBlockchain(blockchain: Blockchain) {
        const blockchainData = JSON.stringify(blockchain, null, 4); // Pretty print JSON
        const dir = path.dirname(this.blockchainFilePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(this.blockchainFilePath, blockchainData, 'utf8');
        Logger.info('Blockchain saved to file.');
    }

    // Helper function to convert JSON data back to Blockchain class instance
    private parseBlockchain(data: any): Blockchain {
        const blockchain = new Blockchain();

        blockchain.chain = data.chain.map((blockData: any) => {
            const block = new Block(blockData.index, blockData.timestamp, blockData.transactions, blockData.previousHash);
            block.hash = blockData.hash;
            block.nonce = blockData.nonce;
            return block;
        });

        blockchain.pendingTransactions = data.pendingTransactions.map((tx: any) => {
            return new Transaction(tx.fromAddress, tx.toAddress, tx.amount, tx.type);
        });

        blockchain.difficulty = data.difficulty;
        blockchain.miningReward = data.miningReward;

        return blockchain;
    }
}

export default BlockchainManager;
