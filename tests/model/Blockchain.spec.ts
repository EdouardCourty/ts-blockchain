import Blockchain from '../../src/model/Blockchain';
import Block from '../../src/model/Block';
import Transaction from '../../src/model/Transaction';
import InsufficientFundsError from '../../src/error/InsufficientFundsError';
import InvalidBlockError from '../../src/error/InvalidBlockError';
// @ts-ignore
import TestBlockProvider from '../support/TestBlockProvider';
import TestTransactionProvider from "../support/TestTransactionProvider";
import Miner from "../../src/service/Miner";

jest.mock('../../src/service/Logger');

describe('Blockchain', () => {
    let blockchain: Blockchain;
    const miningReward = 100;
    const difficulty = 1;
    const blockSize = 10;
    const blockTime = 6000;

    beforeEach(() => {
        blockchain = new Blockchain(difficulty, miningReward, blockSize, blockTime);
    });

    it('should initialize with a genesis block', () => {
        expect(blockchain.chain.length).toBe(1);
        const genesisBlock = blockchain.getLatestBlock();
        expect(genesisBlock.index).toBe(0);
        expect(genesisBlock.previousHash).toBe('0');
    });

    it('should calculate the balance of an address', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';

        // Mine a reward block to give balance to 'fromAddress'
        blockchain.addPendingTransaction(new Transaction(null, fromAddress, miningReward, 'REWARD', 'now'));
        blockchain.addBlock(TestBlockProvider.getBlockWithBalance(blockchain, fromAddress, 100));

        expect(blockchain.getValidatedBalance(fromAddress)).toBe(miningReward);

        // Transfer funds from 'fromAddress' to 'toAddress'
        blockchain.addPendingTransaction(TestTransactionProvider.getTransaction(fromAddress, toAddress, 50));

        let block = new Block(2, new Date().toISOString(), blockchain.pendingTransactions, blockchain.getLatestBlock().hash);
        block = Miner.mineBlock(block, blockchain.difficulty);

        blockchain.addBlock(block);

        expect(blockchain.getValidatedBalance(fromAddress)).toBe(150); // Sent 50, 150 remaining
        expect(blockchain.getValidatedBalance(toAddress)).toBe(50); // Received 50
    });

    it('should throw InsufficientFundsError for transactions with insufficient funds', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';

        blockchain.addBlock(TestBlockProvider.getBlockWithBalance(blockchain, fromAddress, 100));

        expect(blockchain.getValidatedBalance(fromAddress)).toBe(100);

        const invalidTransaction = new Transaction(fromAddress, toAddress, 200 + 1, 'REGULAR', 'now');

        expect(() => {
            blockchain.addPendingTransaction(invalidTransaction);
        }).toThrow(InsufficientFundsError);
    });

    it('should allow transactions when the sender has sufficient funds', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';

        blockchain.addBlock(TestBlockProvider.getBlockWithBalance(blockchain, fromAddress, 100));

        expect(blockchain.getValidatedBalance(fromAddress)).toBe(100);

        // Transfer 50 from 'fromAddress' to 'toAddress'
        const validTransaction = new Transaction(fromAddress, toAddress, 50, 'REGULAR', 'now');
        blockchain.addPendingTransaction(validTransaction);

        let block = new Block(2, new Date().toISOString(), blockchain.pendingTransactions, blockchain.getLatestBlock().hash);
        block = Miner.mineBlock(block, blockchain.difficulty);

        blockchain.addBlock(block);

        expect(blockchain.getValidatedBalance(fromAddress)).toBe(50); // 100 - 50 = 50 remaining
        expect(blockchain.getValidatedBalance(toAddress)).toBe(50);   // 50 received
    });

    it('should calculate effective balance considering pending transactions', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';

        // Add mining reward to 'fromAddress'
        blockchain.addBlock(TestBlockProvider.getBlockWithBalance(blockchain, fromAddress, 100));

        // Create a pending transaction
        blockchain.addPendingTransaction(new Transaction(fromAddress, toAddress, 50, 'REGULAR', 'now'));

        expect(blockchain.getTheoricalBalance(fromAddress)).toBe(50); // Subtracted pending transaction
        expect(blockchain.getTheoricalBalance(toAddress)).toBe(50);   // Added pending transaction
    });

    it('should add a valid block to the chain', () => {
        const transactions: Transaction[] = [
            new Transaction('address1', 'address2', 100, 'REGULAR', 'now'),
            new Transaction('address2', 'address3', 50, 'REGULAR', 'now')
        ];

        let newBlock = new Block(1, new Date().toISOString(), transactions, blockchain.getLatestBlock().hash);
        newBlock = Miner.mineBlock(newBlock, blockchain.difficulty);

        blockchain.addBlock(newBlock);

        expect(blockchain.chain.length).toBe(2);
        expect(blockchain.getLatestBlock()).toEqual(newBlock);
    });

    it('should throw InvalidBlockError for blocks with invalid previousHash', () => {
        let invalidBlock = new Block(1, new Date().toISOString(), [], 'invalidPreviousHash');
        invalidBlock = Miner.mineBlock(invalidBlock, difficulty);

        expect(() => {
            blockchain.addBlock(invalidBlock);
        }).toThrow(InvalidBlockError);
    });

    it('should throw InvalidBlockError for blocks with invalid index', () => {
        let validBlock = new Block(1, new Date().toISOString(), [], blockchain.getLatestBlock().hash);
        validBlock = Miner.mineBlock(validBlock, difficulty);

        blockchain.addBlock(validBlock);

        let invalidBlock = new Block(3, new Date().toISOString(), [], blockchain.getLatestBlock().hash); // Incorrect index
        invalidBlock = Miner.mineBlock(invalidBlock, difficulty);

        expect(() => {
            blockchain.addBlock(invalidBlock);
        }).toThrow(InvalidBlockError);
    });

    it('should throw InvalidBlockError for blocks with invalid proof of work', () => {
        const invalidBlock = new Block(1, new Date().toISOString(), [], blockchain.getLatestBlock().hash);
        invalidBlock.hash = 'invalidHash'; // Invalid proof of work

        expect(() => {
            blockchain.addBlock(invalidBlock);
        }).toThrow(InvalidBlockError);
    });

    it('should validate the blockchain correctly', () => {
        blockchain.addBlock(TestBlockProvider.getBlockWithBalance(blockchain, 'edouard', 100));

        expect(blockchain.isChainValid()).toBe(true);

        // Tamper with a block
        blockchain.chain[1].transactions[0].amount = 10000;

        expect(blockchain.isChainValid()).toBe(false);
    });

    it('should calculate its own settings hash', () => {
        const blockchain = new Blockchain(1, 100, 10, 6000);
        expect(blockchain.settingsHash).not.toBeNull();
    });
});
