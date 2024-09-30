import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import Block from '../model/Block';  // Import your block logic
import Logger from './Logger';
import * as config from '../../configuration.json';

class WorkerManager extends EventEmitter {
    private workers: Worker[] = [];
    private isMining: boolean = false;

    private miningStartTimestamp: number|null = null;

    public static instance: WorkerManager|null = null;

    constructor() {
        super();
    }

    public static getInstance(): WorkerManager {
        if (this.instance === null) {
            this.instance = new WorkerManager();
        }

        return this.instance;
    }

    // Start the mining process using multiple workers, each incrementing by "step"
    public mine(block: Block, step: number): void {
        if (this.isMining) {
            Logger.info('Mining is already in progress.');
            return;
        }

        Logger.info(`Starting mining with ${step} workers.`);
        this.isMining = true;
        this.miningStartTimestamp = Date.now();

        for (let i = 0; i < step; i++) {
            this.workers.push(this.spawnWorker(i, step, block));
        }
    }

    // Spawn a worker with its specific starting nonce and step
    private spawnWorker(startNonce: number, step: number, block: Block): Worker {
        const worker = new Worker('./dist/worker/minerWorker.js', {
            workerData: {
                blockData: block.toJSON(),
                difficulty: config.difficulty,
                startNonce,
                step,
            },
        });

        worker.on('message', (message) => {
            const { blockData } = message;
            const minedBlock = Block.fromJSON(blockData);

            const elapsed = (Date.now() - (this.miningStartTimestamp || Date.now())) / 1000;
            Logger.info(`Mining completed by worker. Block mined with nonce: ${minedBlock.nonce}. Took ~${elapsed.toFixed(2)} seconds.`);

            this.terminateAllWorkers();
            this.emit('miningFinished', minedBlock);
        });

        worker.on('error', (error: Error) => {
            Logger.error(`Worker failed with error: ${error.message}`);
        });

        return worker;
    }

    // Terminate all running workers
    public terminateAllWorkers(): void {
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.isMining = false;
    }

    // Resets the service to its default state
    public static reset(): void {
        this.instance?.terminateAllWorkers();

        this.instance = null;
    }
}

export default WorkerManager;
