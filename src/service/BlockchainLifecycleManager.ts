import Blockchain from '../model/Blockchain';
import BlockchainPersister from '../service/BlockchainPersister';
import Logger from '../service/Logger';
import Transaction from "../model/Transaction";
import Block from "../model/Block";

import * as config from '../../configuration.json';
import WorkerManager from "./WorkerManager";

class BlockchainLifecycleManager {
    private static instance: BlockchainLifecycleManager; // Singleton instance
    private blockchain: Blockchain;
    private persister: BlockchainPersister;
    private miningInterval: NodeJS.Timeout | null = null;
    public isMining: boolean = false;

    private constructor() {
        this.persister = new BlockchainPersister(config.blockchainFile);
        this.blockchain = this.persister.loadBlockchain(config.difficulty, config.miningReward);
    }

    // Singleton pattern: Get the single instance of BlockchainLifecycleManager
    public static getInstance(): BlockchainLifecycleManager {
        if (!this.instance) {
            this.instance = new BlockchainLifecycleManager();
        }

        return this.instance;
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
            this.saveBlockchain();

            // Move the buffered transactions to the pending transactions
            this.blockchain.pendingTransactions = [...this.blockchain.transactionBuffer];
            this.blockchain.transactionBuffer = [];

            this.isMining = false;
        })
        workerManager.mine(mineableBlock, step);
    }

    // Add a new transaction and save the blockchain
    public addTransaction(transaction: Transaction): void {
        if (this.isMining) {
            this.blockchain.addBufferedTransactions(transaction);
        } else {
            this.blockchain.addPendingTransaction(transaction);
        }

        this.saveBlockchain();
    }
}

export default BlockchainLifecycleManager;
