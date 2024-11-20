import Block from './Block';
import Transaction from './Transaction';

import InsufficientFundsError from "../error/InsufficientFundsError";
import InvalidBlockError from "../error/InvalidBlockError";
import DuplicateTransactionError from "../error/DuplicateTransactionError";
import crypto from "crypto";

class Blockchain {
    chain: Block[];

    pendingTransactions: Transaction[];
    transactionBuffer: Transaction[];

    difficulty: number;
    miningReward: number;
    blockSize: number;
    blockTime: number;

    settingsHash: string;

    size: number;

    constructor(difficulty: number, miningReward: number, blockSize: number, blockTime: number) {
        this.chain = [this.createGenesisBlock()];
        this.size = 1;
        this.pendingTransactions = [];
        this.transactionBuffer = [];

        this.difficulty = difficulty;
        this.miningReward = miningReward;
        this.blockSize = blockSize;
        this.blockTime = blockTime;

        this.settingsHash = crypto
          .createHash('sha256')
          .update(this.difficulty.toString() + this.miningReward.toString() + this.blockSize.toString() + this.blockTime.toString())
          .digest('hex');
    }

    // Genesis block creation
    private createGenesisBlock(): Block {
        return new Block(0, new Date().toISOString(), [], '0');
    }

    // Get the latest block in the chain
    public getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    // Calculate the effective balance considering pending and confirmed transactions
    public getTheoricalBalance(address: string): number {
        let balance = this.getValidatedBalance(address);

        // Adjust balance for pending transactions
        for (const transaction of this.pendingTransactions) {
            if (transaction.fromAddress === address) {
                balance -= transaction.amount; // Subtract pending outgoing amounts
            }
            if (transaction.toAddress === address) {
                balance += transaction.amount; // Add pending incoming amounts
            }
        }

        return balance;
    }

    private verifyTransaction(transaction: Transaction): void {
        const effectiveBalance = this.getTheoricalBalance(transaction.fromAddress as string);

        // If the sender's balance (including pending transactions) is less than the transaction amount, reject it
        if (transaction.fromAddress !== null && effectiveBalance < transaction.amount) {
            throw new InsufficientFundsError('Insufficient funds');
        }
    }

    public addPendingTransaction(transaction: Transaction): void {
        this.verifyTransaction(transaction);

        this.pendingTransactions.forEach((pendingTransaction) => {
            if (pendingTransaction.signature === transaction.signature) {
                throw new DuplicateTransactionError('Duplicate transaction.');
            }
        })

        this.pendingTransactions.push(transaction);
    }

    public addBufferedTransactions(transaction: Transaction): void {
        this.verifyTransaction(transaction);

        this.transactionBuffer.forEach((bufferedTransaction) => {
            if (bufferedTransaction.signature === transaction.signature) {
                throw new DuplicateTransactionError('Duplicate transaction.');
            }
        })

        this.transactionBuffer.push(transaction);
    }

    public addBlock(newBlock: Block): void {
        const latestBlock = this.getLatestBlock();

        if (newBlock.previousHash !== latestBlock.hash) {
            throw new InvalidBlockError('Invalid previous hash');
        }

        if (newBlock.index !== latestBlock.index + 1) {
            throw new InvalidBlockError('Invalid index');
        }

        if (!newBlock.isValidProofOfWork(this.difficulty)) {
            throw new InvalidBlockError('Invalid proof of work');
        }

        // Add the block to the chain
        this.chain.push(newBlock);
        this.size++;
    }

    // Get balance of a particular address (considering only confirmed transactions)
    public getValidatedBalance(address: string): number {
        let balance = 0;

        // Loop through all the blocks and their transactions
        for (const block of this.chain) {
            for (const transaction of block.transactions) {
                // If the transaction is sending from this address, decrease the balance
                if (transaction.fromAddress === address) {
                    balance -= transaction.amount;

                    continue;
                }

                // If the transaction is sending to this address, increase the balance
                if (transaction.toAddress === address) {
                    balance += transaction.amount;

                    continue;
                }

                // Handle mining reward (where fromAddress is null)
                if (transaction.fromAddress === null && transaction.toAddress === address) {
                    balance += transaction.amount;
                }
            }
        }

        return balance;
    }

    // Check if the blockchain is valid
    public isChainValid(): boolean {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }

            if (!currentBlock.isValidProofOfWork(this.difficulty)) {
                return false;
            }
        }

        return true;
    }

    public toJSON(): object {
        return {
            chain: this.chain.map((block) => block.toJSON()),
            pendingTransactions: this.pendingTransactions.map((tx) => tx.toJSON()),
            bufferedTransactions: this.transactionBuffer.map((tx) => tx.toJSON()),
            difficulty: this.difficulty,
            miningReward: this.miningReward,
            blockSize: this.blockSize,
            blockTime: this.blockTime,
            size: this.size,
        }
    }

    public static fromJSON(data: any): Blockchain {
        const {
            chain,
            pendingTransactions,
            bufferedTransactions,
            difficulty,
            miningReward,
            blockSize,
            blockTime,
            size,
        } = data;

        if (chain.length !== size) {
            throw new Error('Invalid chain length');
        }

        const blockchain = new Blockchain(difficulty, miningReward, blockSize, blockTime);

        blockchain.chain = chain.map((blockData: any) => Block.fromJSON(blockData));
        blockchain.pendingTransactions = pendingTransactions.map((tx: any) => Transaction.fromJSON(tx));
        blockchain.transactionBuffer = bufferedTransactions.map((tx: any) => Transaction.fromJSON(tx));
        blockchain.size = size;

        return blockchain;
    }
}

export default Blockchain;
