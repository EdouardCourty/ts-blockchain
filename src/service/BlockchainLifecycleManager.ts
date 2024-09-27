import Blockchain from '../model/Blockchain';
import BlockchainPersister from '../service/BlockchainPersister';
import Logger from '../service/Logger';
import Transaction from "../model/Transaction";

import { Worker} from "node:worker_threads";

import * as config from '../../configuration.json';
import Block from "../model/Block";

class BlockchainLifecycleManager {
    private static instance: Blockchain;
    private static persister = new BlockchainPersister(config.blockchainFile);
    private static miningInterval: NodeJS.Timeout | null = null;
    public static isMining: boolean = false;

    // Get the blockchain instance (singleton pattern)
    static getInstance(): Blockchain {
        if (!this.instance) {
            this.instance = this.persister.loadBlockchain(config.difficulty, config.miningReward);
        }

        return this.instance;
    }

    // Save the blockchain state
    static saveInstance(): void {
        this.persister.saveBlockchain(this.getInstance());
    }

    // Start the mining loop, which mines blocks at regular intervals
    static startMiningLoop(): void {
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

            this.startMiningInWorker(this.getInstance(), config.miningRewardAddress);
        }, config.blockTime);
    }

    // Stop the mining loop
    static stopMiningLoop(): void {
        if (this.miningInterval !== null) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
            Logger.info('Mining loop has been stopped.');
        } else {
            Logger.info('Mining loop is not currently running.');
        }
    }

    private static startMiningInWorker(blockchain: Blockchain, miningRewardAddress: string): void {
        Logger.info('Mining started.');
        this.isMining = true;

        const worker = new Worker('./dist/worker/minerWorker.js', {
            workerData: {
                lastHash: blockchain.getLatestBlock().hash,
                blockchainData: blockchain,
                difficulty: this.getInstance().difficulty,
                reward: this.getInstance().miningReward,
                miningRewardAddress
            }
        });

        worker.on('message', (message) => {
            const { blockData } = message;
            const newBlock = Block.fromJSON(JSON.parse(blockData));

            Logger.info('Mining completed. Block mined: ' + newBlock.hash);

            this.getInstance().addBlock(newBlock);
            this.saveInstance();

            // Move the buffered transactions to the pending transactions
            this.getInstance().pendingTransactions = [...this.getInstance().transactionBuffer];
            this.getInstance().transactionBuffer = [];

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
    static addTransaction(transaction: Transaction): void {
        const blockchain = this.getInstance();

        if (this.isMining) {
            blockchain.addBufferedTransactions(transaction);
        } else {
            blockchain.addPendingTransaction(transaction);
        }

        this.saveInstance();
    }
}

export default BlockchainLifecycleManager;
