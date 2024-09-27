import Blockchain from '../../src/model/Blockchain';
import Transaction from '../../src/model/Transaction';
import Block from '../../src/model/Block';

jest.mock('../../src/service/Logger');  // Mock the logger to avoid actual logging during tests

describe('Blockchain with a PoW model', () => {
    let blockchain: Blockchain;

    beforeEach(() => {
        blockchain = new Blockchain();
    });

    it('should initialize the blockchain with a genesis block', () => {
        expect(blockchain.chain.length).toBe(1);
        expect(blockchain.chain[0]).toBeInstanceOf(Block);
        expect(blockchain.chain[0].previousHash).toBe('0'); // Genesis block should have a previousHash of '0'
    });

    it('should create a transaction and add it to pending transactions', () => {
        blockchain.minePendingTransactions('address1'); // Add funds to address1

        const fromAddress = 'address1';
        const toAddress = 'address2';
        const amount = 50;

        const transaction = new Transaction(fromAddress, toAddress, amount);

        blockchain.addPendingTransaction(transaction);

        expect(blockchain.pendingTransactions.length).toBe(1);
        expect(blockchain.pendingTransactions[0]).toEqual(transaction);
    });

    it('should throw an error if the sender has insufficient funds', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';
        const amount = 1000; // Large amount to trigger insufficient funds

        const transaction = new Transaction(fromAddress, toAddress, amount);

        expect(() => {
            blockchain.addPendingTransaction(transaction);
        }).toThrow('Insufficient funds');
    });

    it('should mine a block and reward the miner', () => {
        const minerAddress = 'miner1';
        blockchain.minePendingTransactions(minerAddress);

        expect(blockchain.chain.length).toBe(2); // After mining, there should be 2 blocks

        const rewardTransaction = blockchain.chain[1].transactions.find(tx => tx.toAddress === minerAddress);
        expect(rewardTransaction).toBeDefined();
        expect(rewardTransaction?.amount).toBe(blockchain.miningReward);
    });

    it('should calculate the balance of an address correctly after mining and transactions', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';
        const minerAddress = 'miner1';

        // Give the fromAddress some balance by rewarding it in a mined block first
        blockchain.minePendingTransactions(fromAddress); // Add a reward to fromAddress

        const initialBalanceFrom = blockchain.getBalanceOfAddress(fromAddress);
        expect(initialBalanceFrom).toBe(100); // Should be the mining reward

        // Create a transaction from fromAddress to toAddress
        const transaction = new Transaction(fromAddress, toAddress, 50);
        blockchain.addPendingTransaction(transaction);

        // Mine the transaction
        blockchain.minePendingTransactions(minerAddress);

        expect(blockchain.getBalanceOfAddress(fromAddress)).toBe(50); // Spent 50, 50 remaining
        expect(blockchain.getBalanceOfAddress(toAddress)).toBe(50);    // Received 50
        expect(blockchain.getBalanceOfAddress(minerAddress)).toBe(100); // Miner gets 100 as the reward
    });

    it('should validate the chain correctly', () => {
        const minerAddress = 'miner1';
        blockchain.minePendingTransactions(minerAddress);

        expect(blockchain.isChainValid()).toBe(true);

        // Tamper the blockchain
        blockchain.chain[1].transactions[0].amount = 10000;

        expect(blockchain.isChainValid()).toBe(false); // The chain should be invalid after tampering
    });

    it('should calculate the effective balance of an address with pending transactions', () => {
        const fromAddress = 'address1';
        const toAddress = 'address2';
        const amount = 100;

        // Give the fromAddress some balance by rewarding it in a mined block first
        blockchain.minePendingTransactions(fromAddress); // Add a reward to fromAddress

        const initialBalanceFrom = blockchain.getBalanceOfAddress(fromAddress);
        expect(initialBalanceFrom).toBe(100); // Should be the mining reward

        // Create a pending transaction from fromAddress to toAddress
        const transaction = new Transaction(fromAddress, toAddress, amount);
        blockchain.addPendingTransaction(transaction);

        // Since the transaction is pending, the effective balance should be updated
        const effectiveBalanceFrom = blockchain.getEffectiveBalanceOfAddress(fromAddress);
        const effectiveBalanceTo = blockchain.getEffectiveBalanceOfAddress(toAddress);

        expect(effectiveBalanceFrom).toBe(0); // Pending outgoing transaction of 100
        expect(effectiveBalanceTo).toBe(100); // Pending incoming transaction of 100
    });

    it('should add a valid block with correct proof-of-work', () => {
        // Create a block with valid proof-of-work
        const validBlock = new Block(
            blockchain.chain.length,
            new Date().toISOString(),
            [new Transaction('address1', 'address2', 50)],
            blockchain.getLatestBlock().hash
        );

        // Mine the block (solve the PoW)
        validBlock.mineBlock(blockchain.difficulty);

        // Add the block and expect it to be successfully added to the chain
        expect(() => blockchain.addBlock(validBlock)).not.toThrow();

        expect(blockchain.chain.length).toBe(2);  // Block should be added to the chain
        expect(blockchain.chain[1]).toEqual(validBlock);
    });

    it('should reject a block with invalid proof-of-work', () => {
        // Create a block with an incorrect proof-of-work
        const invalidBlock = new Block(
            blockchain.chain.length,
            new Date().toISOString(),
            [new Transaction('address1', 'address2', 50)],
            blockchain.getLatestBlock().hash
        );

        // Manually modify the block's hash to simulate incorrect PoW
        invalidBlock.hash = '1234567890abcdef';  // Invalid hash that doesn't satisfy PoW

        // Try to add the block and expect it to be rejected
        expect(() => blockchain.addBlock(invalidBlock)).toThrow();

        expect(blockchain.chain.length).toBe(1);  // The block should not be added
    });

    it('should reject a block with mismatched previous hash', () => {
        // Create a valid block but with an incorrect previousHash
        const validBlock = new Block(
            blockchain.chain.length,
            new Date().toISOString(),
            [new Transaction('address1', 'address2', 50)],
            'incorrect_previous_hash'  // Mismatched previous hash
        );

        // Mine the block to satisfy the proof-of-work
        validBlock.mineBlock(blockchain.difficulty);

        // Try to add the block and expect it to be rejected due to incorrect previousHash
        expect(() => blockchain.addBlock(validBlock)).toThrow();

        expect(blockchain.chain.length).toBe(1);  // The block should not be added
    });

    it('should not add rejected blocks and maintain the chain length', () => {
        const invalidBlock = new Block(
            blockchain.chain.length,
            new Date().toISOString(),
            [new Transaction('address1', 'address2', 50)],
            'incorrect_previous_hash'
        );

        invalidBlock.mineBlock(blockchain.difficulty);

        expect(() => blockchain.addBlock(invalidBlock)).toThrow();
        expect(blockchain.chain.length).toBe(1);  // Ensure no new block was added
    });
});
