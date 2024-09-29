import Block from '../../src/model/Block';
import Transaction from '../../src/model/Transaction';

describe('Block', () => {
    it('should create a block with the correct properties', () => {
        const index = 1;
        const timestamp = new Date().toISOString();
        const transactions: Transaction[] = [
            new Transaction('address1', 'address2', 100, 'REGULAR', 'now'),
            new Transaction('address2', 'address3', 50, 'REGULAR', 'now')
        ];
        const previousHash = 'previousHash';

        const block = new Block(index, timestamp, transactions, previousHash);

        expect(block.index).toBe(index);
        expect(block.timestamp).toBe(timestamp);
        expect(block.transactions).toBe(transactions);
        expect(block.previousHash).toBe(previousHash);
        expect(block.nonce).toBe(0);  // Initial nonce value should be 0
        expect(block.hash).toBe(block.calculateHash());  // The hash should be the calculated hash
    });

    it('should calculate a valid hash', () => {
        const index = 1;
        const timestamp = new Date().toISOString();
        const transactions: Transaction[] = [
            new Transaction('address1', 'address2', 100, 'REGULAR', 'now')
        ];
        const previousHash = 'previousHash';

        const block = new Block(index, timestamp, transactions, previousHash);
        const calculatedHash: string = block.calculateHash();

        expect(calculatedHash).toHaveLength(64);  // SHA-256 hash has a length of 64 hex characters
    });

    it('should mine a block with the correct difficulty', () => {
        const index = 1;
        const timestamp = new Date().toISOString();
        const transactions: Transaction[] = [
            new Transaction('address1', 'address2', 100, 'REGULAR', 'now')
        ];
        const previousHash = 'previousHash';
        const block = new Block(index, timestamp, transactions, previousHash);

        const difficulty = 2;  // Set the difficulty to 2 (hash must start with two '0's)

        block.mineBlock(difficulty);

        // The mined block's hash should start with '00' for a difficulty of 2
        expect(block.hash.substring(0, difficulty)).toBe('00');
        expect(block.nonce).toBeGreaterThan(0);  // The nonce should be incremented during mining
    });

    it('should change the hash when mining a block', () => {
        const index = 1;
        const timestamp = new Date().toISOString();
        const transactions: Transaction[] = [
            new Transaction('address1', 'address2', 100, 'REGULAR', 'now')
        ];
        const previousHash = 'previousHash';
        const block = new Block(index, timestamp, transactions, previousHash);

        const initialHash = block.hash;
        block.mineBlock(1);  // Difficulty 1 (hash must start with a single '0')

        expect(block.hash).not.toBe(initialHash);  // The hash should have changed after mining
    });
});
