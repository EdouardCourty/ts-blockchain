import Blockchain from '../model/Blockchain';
import BlockchainPersister from '../service/BlockchainPersister';
import Logger from '../service/Logger';
import Transaction from "../model/Transaction";
import Block from "../model/Block";

import * as config from '../../configuration.json';
import WorkerManager from "./WorkerManager";
import PeerManager from "./PeerManager";
import InvalidBlockError from "../error/InvalidBlockError";

class BlockchainLifecycleManager {
    private static instance: BlockchainLifecycleManager | null = null;

    private blockchain: Blockchain;
    private persister: BlockchainPersister;
    private miningInterval: NodeJS.Timeout | null = null;
    public isMining = false;

    private constructor() {
        this.persister = new BlockchainPersister(config.blockchainFile);
        this.blockchain = this.persister.loadBlockchain(config.difficulty, config.miningReward, config.blockSize);
    }

    // Singleton pattern: Get the single instance of BlockchainLifecycleManager
    public static getInstance(): BlockchainLifecycleManager {
        if (!this.instance) {
            this.instance = new BlockchainLifecycleManager();
        }

        return this.instance;
    }

    public static resetInstance(): void {
        this.instance = null;
    }

    // Get the blockchain instance
    public getBlockchain(): Blockchain {
        return this.blockchain;
    }

    // Save the blockchain state
    public saveBlockchain(): void {
        this.persister.saveBlockchain(this.blockchain);
    }

    // Start the mining loop, which mines blocks at regular intervals
    public startMiningLoop(): void {
        if (this.miningInterval !== null) {
            Logger.info('Mining loop is already running.');
            return;
        }

        Logger.info('Starting the mining loop.');
        this.miningInterval = setInterval(() => {
            if (this.isMining) {
                Logger.info('Mining is already in progress. Skipping this round.');
                return;
            }

            this.startMiningInWorker(config.miningRewardAddress, config.workers);
        }, config.blockTime);
    }

    // Stop the mining loop
    public stopMiningLoop(): void {
        WorkerManager.reset();
        this.isMining = false;

        if (this.miningInterval !== null) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;

            Logger.info('Mining loop has been stopped.');
        } else {
            Logger.info('Mining loop is not currently running.');
        }
    }

    // Mine pending transactions and reward the miner
    public generateMineableBlock(miningRewardAddress: string): Block {
        const rewardTransaction = new Transaction(
            null,
            miningRewardAddress,
            this.blockchain.miningReward,
            'REWARD',
            new Date().toISOString()
        );

        return new Block(
            this.blockchain.chain.length,
            new Date().toISOString(),
            [
                ...this.blockchain.pendingTransactions,
                rewardTransaction,
            ],
            this.blockchain.getLatestBlock().hash
        );
    }

    private startMiningInWorker(miningRewardAddress: string, step: number): void {
        Logger.info('Mining started.');
        this.isMining = true;

        const mineableBlock = this.generateMineableBlock(miningRewardAddress);
        const workerManager = WorkerManager.getInstance();

        workerManager.on('miningFinished', (blockData) => {
            const newBlock = Block.fromJSON(blockData);

            Logger.info('Mining completed. Block mined: ' + newBlock.hash);
            WorkerManager.reset();

            this.blockchain.addBlock(newBlock);

            // Move a maximum of `blockSize` transactions from the buffer to the pending transactions
            const transactionsToTransfer = this.blockchain.transactionBuffer.slice(0, this.blockchain.blockSize);
            this.blockchain.pendingTransactions = [...transactionsToTransfer];

            // Remove the transferred transactions from the buffer
            this.blockchain.transactionBuffer = this.blockchain.transactionBuffer.slice(this.blockchain.blockSize);

            this.isMining = false;
            this.saveBlockchain();

            PeerManager.getInstance().broadcastNewBlock(newBlock);
        })
        workerManager.mine(mineableBlock, step);
    }

    public addBlock(block: Block): void {
        block.transactions.forEach((transaction) => {
            if (!transaction.isValid()) {
                throw new InvalidBlockError('Invalid transaction in block');
            }
        });

        const rewardTransactions = block.transactions.filter((transaction) => transaction.type === 'REWARD')
        if (rewardTransactions.length !== 1) {
            throw new InvalidBlockError('Block must contain exactly one reward transaction');
        }

        this.blockchain.addBlock(block);

        const newBlockTransactionSignatures: string[] = block.transactions.map((transaction) => {
            return transaction.signature;
        });

        this.blockchain.pendingTransactions = [...this.blockchain.pendingTransactions, ...this.blockchain.transactionBuffer];
        this.blockchain.transactionBuffer = [];

        // Remove pending transactions from the local blockchain that were processed in the new block
        this.blockchain.pendingTransactions = this.blockchain.pendingTransactions.filter((transaction) => {
            return !newBlockTransactionSignatures.includes(transaction.signature);
        });

        this.saveBlockchain();

        this.stopMiningLoop();
        this.startMiningLoop();
    }

    // Add a new transaction and save the blockchain
    public addTransaction(transaction: Transaction, broadcast = false): void {
        if (this.isMining) {
            this.blockchain.addBufferedTransactions(transaction);
        } else {
            this.blockchain.addPendingTransaction(transaction);

            if (this.blockchain.pendingTransactions.length >= this.blockchain.blockSize) {
                Logger.info('Maximum block size reached. Mining a new block.');

                this.startMiningInWorker(config.miningRewardAddress, config.workers);
            }
        }

        if (broadcast) {
            PeerManager.getInstance().broadcastNewTransaction(transaction);
        }

        this.saveBlockchain();
    }

    // Synchronize with peers' blockchains on startup
    public async synchronizeWithPeers(): Promise<boolean> {
        Logger.info('Synchronizing with peers...');
        const peerBlockchains = await PeerManager.getInstance().fetchAllPeerBlockchains();

        let longestValidChain: Blockchain | null = null;

        peerBlockchains.forEach((peerChain: Blockchain) => {
            const longerChainFoundSoFar = longestValidChain ? longestValidChain.chain.length : 0;
            if (
                peerChain.isChainValid()
                && peerChain.size > longerChainFoundSoFar
                && peerChain.size > this.blockchain.size
                && this.shouldReplaceLocalBlockchain(peerChain)
            ) {
                longestValidChain = peerChain;
            }
        });

        if (longestValidChain) {
            Logger.info('Found a valid longer blockchain from peers. Replacing local chain.');
            this.blockchain = longestValidChain;

            this.saveBlockchain();
            return true;
        }

        Logger.info('No valid longer blockchain found.');
        return false;
    }

    // Check if the local blockchain has common history with a peer blockchain
    private shouldReplaceLocalBlockchain(peerChain: Blockchain): boolean {
        if (this.blockchain.size <= 1) {
            return true;  // Local chain is empty or has only the genesis block
        }

        const minLength = Math.min(this.blockchain.size, peerChain.size);

        for (let i = 0; i < minLength; i++) {
            const localBlock = this.blockchain.chain[i];
            const peerBlock = peerChain.chain[i];

            if (localBlock.hash !== peerBlock.hash) {
                return false;  // Chains diverge at some point
            }
        }

        return true;  // Chains have common history up to the length of the shorter chain
    }
}

export default BlockchainLifecycleManager;
