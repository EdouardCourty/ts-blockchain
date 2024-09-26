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
}

export default Block;
