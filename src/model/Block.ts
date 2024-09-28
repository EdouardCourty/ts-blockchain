import * as crypto from 'crypto';
import Transaction from './Transaction';

class Block {
    index: number;
    timestamp: string;
    transactions: Transaction[];
    previousHash: string;
    hash: string;
    nonce: number;

    constructor(index: number, timestamp: string, transactions: Transaction[], previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    // Calculates the hash for the block
    calculateHash(): string {
        return crypto
            .createHash('sha256')
            .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
            .digest('hex');
    }

    // Proof-of-work algorithm to ensure the block has enough difficulty
    mineBlock(difficulty: number) {
        const target = Array(difficulty + 1).join('0');

        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
    }

    isValidProofOfWork(difficulty: number): boolean {
        const target = Array(difficulty + 1).join('0');
        return this.hash.substring(0, difficulty) === target;
    }

    static fromJSON(data: any): Block {
        const { index, timestamp, transactions, previousHash, hash, nonce } = data;

        // Reconstruct transactions from JSON data if necessary
        const transactionObjects = transactions.map((tx: any) => {
            return new Transaction(tx.fromAddress, tx.toAddress, tx.amount, tx.type);
        });

        const block = new Block(index, timestamp, transactionObjects, previousHash);
        block.hash = hash;  // Set the hash from JSON data
        block.nonce = nonce;  // Set the nonce from JSON data

        return block;
    }
}

export default Block;
