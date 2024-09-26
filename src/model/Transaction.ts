import { ec as EC } from 'elliptic';
import * as crypto from 'crypto';

const ec = new EC('secp256k1');

export type TransactionType = 'REWARD' | 'REGULAR';

class Transaction {
    fromAddress: string | null;
    toAddress: string;
    amount: number;
    signature: string;
    type: TransactionType;

    constructor(fromAddress: string | null, toAddress: string, amount: number, type: TransactionType = 'REGULAR') {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.signature = '';
        this.type = type;
    }

    // Calculate the transaction hash
    calculateHash(): string {
        return crypto
            .createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount)
            .digest('hex');
    }

    // Check if the transaction is valid
    isValid(): boolean {
        if (this.type === 'REWARD' && !this.fromAddress) return true; // Reward transactions have no fromAddress

        if (this.fromAddress === null) {
            throw new Error('Transaction has no origin address.');
        }

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');

        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

export default Transaction;
