import Blockchain from '../model/Blockchain';
import BlockchainPersister from '../service/BlockchainPersister';
import Logger from '../service/Logger';
import Transaction from "../model/Transaction";
import Block from "../model/Block";

import { Worker } from "node:worker_threads";
import * as config from '../../configuration.json';

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
        if (!BlockchainLifecycleManager.instance) {
            BlockchainLifecycleManager.instance = new BlockchainLifecycleManager();
        }
        return BlockchainLifecycleManager.instance;
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

            this.startMiningInWorker(config.miningRewardAddress);
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
            'REWARD'
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

    private startMiningInWorker(miningRewardAddress: string): void {
        Logger.info('Mining started.');
        this.isMining = true;

        const mineableBlock = this.generateMineableBlock(miningRewardAddress);

        const worker = new Worker('./dist/worker/minerWorker.js', {
            workerData: {
                blockData: mineableBlock,
                difficulty: this.blockchain.difficulty,
            },
        });

        worker.on('message', (message) => {
            const { blockData } = message;
            const newBlock = Block.fromJSON(JSON.parse(blockData));

            Logger.info('Mining completed. Block mined: ' + newBlock.hash);

            this.blockchain.addBlock(newBlock);
            this.saveBlockchain();

            // Move the buffered transactions to the pending transactions
            this.blockchain.pendingTransactions = [...this.blockchain.transactionBuffer];
            this.blockchain.transactionBuffer = [];

            this.isMining = false;
        });

        // Listen for errors
        worker.on('error', (error: Error) => {
            Logger.error('Mining failed with error: ' + error.message);
            this.isMining = false;
        });

        // Clean up when the worker is done
        worker.on('exit', (code: number) => {
            if (code !== 0) {
                Logger.error('Mining worker stopped with exit code ' + code);
            }
            this.isMining = false;
        });
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
