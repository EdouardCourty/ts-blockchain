import BlockchainLifecycleManager from '../../src/service/BlockchainLifecycleManager';
import Blockchain from '../../src/model/Blockchain';
import BlockchainPersister from '../../src/service/BlockchainPersister';
import Transaction from '../../src/model/Transaction';
import Block from '../../src/model/Block';
import InvalidBlockError from '../../src/error/InvalidBlockError';
import WorkerManager from '../../src/service/WorkerManager';
import PeerManager from '../../src/service/PeerManager';
import Logger from '../../src/service/Logger';
// @ts-ignore
import TestBlockProvider from "../support/TestBlockProvider";

// Mock necessary modules
jest.mock('../../src/service/BlockchainPersister');
jest.mock('../../src/service/WorkerManager');
jest.mock('../../src/service/PeerManager');
jest.mock('../../src/service/Logger');

describe('BlockchainLifecycleManager', () => {
    let blockchainLifecycleManager: BlockchainLifecycleManager;

    beforeEach(() => {
        jest.clearAllMocks();

        const blockchain = new Blockchain(2, 100, 10);
        jest.spyOn(BlockchainPersister.prototype, 'loadBlockchain').mockReturnValue(blockchain);

        const peerManager = new PeerManager();
        jest.spyOn(PeerManager, 'getInstance').mockReturnValue(peerManager);

        const workerManager = new WorkerManager();
        jest.spyOn(WorkerManager, 'getInstance').mockReturnValue(workerManager);

        blockchainLifecycleManager = BlockchainLifecycleManager.getInstance();
    });

    it('should be a singleton', () => {
        const instance1 = BlockchainLifecycleManager.getInstance();
        const instance2 = BlockchainLifecycleManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should save the blockchain when requested', () => {
        blockchainLifecycleManager.saveBlockchain();
        expect(BlockchainPersister.prototype.saveBlockchain).toHaveBeenCalledWith(expect.any(Blockchain));
    });

    it('should add a valid transaction to the pending transactions', () => {
        // Add funds to address1
        const transactionBlock = TestBlockProvider.getBlockWithBalance(
            blockchainLifecycleManager.getBlockchain(),
            'address1',
            100
        );
        blockchainLifecycleManager.addBlock(transactionBlock);

        const transaction = new Transaction('address1', 'address2', 50, 'REGULAR', new Date().toISOString());
        blockchainLifecycleManager.addTransaction(transaction, false);

        const blockchain = blockchainLifecycleManager.getBlockchain();
        expect(blockchain.pendingTransactions.length).toBe(1);
        expect(blockchain.pendingTransactions[0]).toBe(transaction);
    });

    it('should buffer transactions if mining is in progress', () => {
        // Add funds to address1
        const transactionBlock = TestBlockProvider.getBlockWithBalance(
            blockchainLifecycleManager.getBlockchain(),
            'address1',
            100
        );
        blockchainLifecycleManager.addBlock(transactionBlock);

        const transaction = new Transaction('address1', 'address2', 50, 'REGULAR', new Date().toISOString());
        blockchainLifecycleManager.isMining = true; // Simulate mining in progress
        blockchainLifecycleManager.addTransaction(transaction, false);

        const blockchain = blockchainLifecycleManager.getBlockchain();
        expect(blockchain.transactionBuffer.length).toBe(1);
        expect(blockchain.transactionBuffer[0]).toBe(transaction);
        expect(blockchain.pendingTransactions.length).toBe(0); // Nothing added to pending while mining
    });

    it('should move buffered transactions to pending after mining completes', () => {
        // Add funds to address1
        const transactionBlock = TestBlockProvider.getBlockWithBalance(
            blockchainLifecycleManager.getBlockchain(),
            'address1',
            1000
        );
        blockchainLifecycleManager.addBlock(transactionBlock);
        blockchainLifecycleManager.isMining = true;

        // Add some transactions to the buffer
        const transaction1 = new Transaction('address1', 'address2', 50, 'REGULAR', new Date().toISOString());
        transaction1.signature = 'sig_1';
        const transaction2 = new Transaction('address1', 'address3', 30, 'REGULAR', new Date().toISOString());
        transaction2.signature = 'sig_2';

        blockchainLifecycleManager.addTransaction(transaction1, false);
        blockchainLifecycleManager.addTransaction(transaction2, false);

        expect(blockchainLifecycleManager.getBlockchain().transactionBuffer.length).toBe(2);

        blockchainLifecycleManager.isMining = false;

        // Add block and move transactions from buffer to pending
        const block = TestBlockProvider.getBlockWithBalance(
            blockchainLifecycleManager.getBlockchain(),
            'address1',
            100
        );
        blockchainLifecycleManager.addBlock(block);

        const blockchain = blockchainLifecycleManager.getBlockchain();

        expect(blockchain.transactionBuffer.length).toBe(0);
        expect(blockchain.pendingTransactions.length).toBe(2);
        expect(blockchain.pendingTransactions).toContain(transaction1);
        expect(blockchain.pendingTransactions).toContain(transaction2);
    });

    it('should mine a new block when block size is reached', () => {
        // Add funds to address1
        const transactionBlock = TestBlockProvider.getBlockWithBalance(
            blockchainLifecycleManager.getBlockchain(),
            'address1',
            1000
        );
        blockchainLifecycleManager.addBlock(transactionBlock);

        for (let i = 0; i < 10; i++) {
            const transaction = new Transaction('address1', 'address_' + i, 10, 'REGULAR', new Date().toISOString());
            transaction.signature = 'sig_' + i;

            blockchainLifecycleManager.addTransaction(transaction, false);
        }

        expect(Logger.info).toHaveBeenCalledWith('Maximum block size reached. Mining a new block.');
        expect(WorkerManager.getInstance().mine).toHaveBeenCalled();
    });

    it('should not mine a block if block size is not reached', () => {
        blockchainLifecycleManager.getBlockchain().pendingTransactions = []; // Clear pending transactions

        // Add funds to address1
        const transactionBlock = TestBlockProvider.getBlockWithBalance(
            blockchainLifecycleManager.getBlockchain(),
            'address1',
            100
        );
        blockchainLifecycleManager.addBlock(transactionBlock);

        const transaction = new Transaction('address1', 'address2', 50, 'REGULAR', new Date().toISOString());
        blockchainLifecycleManager.addTransaction(transaction, false);

        expect(WorkerManager.getInstance().mine).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid block with incorrect proof of work', () => {
        const block = new Block(1, new Date().toISOString(), [], 'previousHash');
        block.hash = 'invalidHash'; // Simulate an invalid proof of work

        expect(() => {
            blockchainLifecycleManager.addBlock(block);
        }).toThrow(InvalidBlockError);
    });

    it('should replace its blockchain with a valid longer blockchain from a peer', async () => {
        // Simulate a valid longer chain
        const longerBlockchain = new Blockchain(2, 100, 5);
        longerBlockchain.chain = [...blockchainLifecycleManager.getBlockchain().chain]; // Make sure of common history

        const block1 = TestBlockProvider.getEmptyBlock(
            longerBlockchain.getLatestBlock(),
            blockchainLifecycleManager.getBlockchain().difficulty
        );
        const block2 = TestBlockProvider.getEmptyBlock(
            block1,
            blockchainLifecycleManager.getBlockchain().difficulty
        );

        longerBlockchain.addBlock(block1);
        longerBlockchain.addBlock(block2);

        jest.spyOn(PeerManager.getInstance(), 'fetchAllPeerBlockchains').mockResolvedValue([longerBlockchain]);

        const result = await blockchainLifecycleManager.synchronizeWithPeers();

        expect(result).toBe(true);
        expect(blockchainLifecycleManager.getBlockchain()).toBe(longerBlockchain);
        expect(BlockchainPersister.prototype.saveBlockchain).toHaveBeenCalledWith(longerBlockchain);
        expect(Logger.info).toHaveBeenCalledWith('Found a valid longer blockchain from peers. Replacing local chain.');
    });

    it('should not replace its blockchain if no valid longer chain is found', async () => {
        const invalidBlockchain = new Blockchain(2, 100, 5); // Simulate an invalid chain
        jest.spyOn(invalidBlockchain, 'isChainValid').mockReturnValue(false);
        jest.spyOn(PeerManager.getInstance(), 'fetchAllPeerBlockchains').mockResolvedValue([invalidBlockchain]);

        const result = await blockchainLifecycleManager.synchronizeWithPeers();
        expect(result).toBe(false);
        expect(Logger.info).toHaveBeenCalledWith('No valid longer blockchain found.');
    });
});
