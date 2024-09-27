import Block from './Block';
import Transaction from './Transaction';

class Blockchain {
    chain: Block[];
    pendingTransactions: Transaction[];
    transactionBuffer: Transaction[];

    difficulty: number;
    miningReward: number;
    isMining: boolean;

    constructor(difficulty: number, miningReward: number) {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.transactionBuffer = [];

        this.difficulty = difficulty;
        this.miningReward = miningReward;
        this.isMining = false;
    }

    // Genesis block creation
    private createGenesisBlock(): Block {
        return new Block(0, new Date().toISOString(), [], '0');
    }

    // Get the latest block in the chain
    public getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    // Mine pending transactions and reward the miner
    public minePendingTransactions(miningRewardAddress: string): Block {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 'REWARD');
        this.pendingTransactions.push(rewardTx);

        const block = new Block(this.chain.length, new Date().toISOString(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        return block;
    }

    // Calculate the effective balance considering pending and confirmed transactions
    public getEffectiveBalanceOfAddress(address: string): number {
        let balance = this.getBalanceOfAddress(address);

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
        const effectiveBalance = this.getEffectiveBalanceOfAddress(transaction.fromAddress as string);

        // If the sender's balance (including pending transactions) is less than the transaction amount, reject it
        if (transaction.fromAddress !== null && effectiveBalance < transaction.amount) {
            throw new Error('Insufficient funds');
        }
    }

    public addPendingTransaction(transaction: Transaction) {
        this.verifyTransaction(transaction);

        this.pendingTransactions.push(transaction);
    }

    public addBufferedTransactions(transaction: Transaction): void {
        this.verifyTransaction(transaction);

        this.transactionBuffer.push(transaction);
    }

    public addBlock(newBlock: Block) {
        const latestBlock = this.getLatestBlock();
        if (newBlock.previousHash !== latestBlock.hash) {
            throw new Error('Invalid previous hash');
        }

        if (newBlock.index !== latestBlock.index + 1) {
            throw new Error('Invalid index');
        }

        if (!newBlock.isValidProofOfWork(this.difficulty)) {
            throw new Error('Invalid proof of work');
        }

        // Add the block to the chain
        this.chain.push(newBlock);
    }

    // Get balance of a particular address (considering only confirmed transactions)
    public getBalanceOfAddress(address: string): number {
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
}

export default Blockchain;
