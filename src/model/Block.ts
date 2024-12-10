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
    public calculateHash(): string {
        const transactionHashes = this.transactions.map((tx) => tx.calculateHash()).join(',');

        return crypto
            .createHash('sha256')
            .update(this.index + this.previousHash + this.timestamp + transactionHashes + this.nonce)
            .digest('hex');
    }

    public isValidProofOfWork(difficulty: number): boolean {
        if (this.hash === null) {
            return false;
        }

        const target = Array(difficulty + 1).join('0');

        if (this.hash.substring(0, difficulty) !== target) {
            return false;
        }

        return this.hash === this.calculateHash();
    }

    public static fromJSON(data: any): Block {
        const { index, timestamp, transactions, previousHash, hash, nonce } = data;

        // Reconstruct transactions from JSON data if necessary
        const transactionObjects = transactions.map((tx: any) => {
            return Transaction.fromJSON(tx);
        });

        const block = new Block(index, timestamp, transactionObjects, previousHash);
        block.hash = hash;  // Set the hash from JSON data
        block.nonce = nonce;  // Set the nonce from JSON data

        return block;
    }

    public toJSON(): object {
        return {
            index: this.index,
            timestamp: this.timestamp,
            transactions: this.transactions.map((tx) => tx.toJSON()),
            previousHash: this.previousHash,
            hash: this.hash,
            nonce: this.nonce
        };
    }
}

export default Block;
