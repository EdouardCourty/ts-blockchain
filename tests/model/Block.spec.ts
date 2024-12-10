import Block from '../../src/model/Block';
import Transaction from '../../src/model/Transaction';
import TestBlockProvider from "../support/TestBlockProvider";

jest.mock('../../src/service/Logger');

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

    it('should validate a proof of work with a valid nonce', () => {
        // Create a block with a proof of work difficulty of 2
        const block = TestBlockProvider.getEmptyBlock(null, 2);

        expect(block.isValidProofOfWork(2)).toBe(true);
    });

    it('should not validate a proof of work with an invalid nonce', () => {
        const block = TestBlockProvider.getEmptyBlock(null, 2);
        block.nonce = block.nonce + 1; // Increment the nonce to make the hash invalid

        expect(block.isValidProofOfWork(2)).toBe(false);
    });

    it('should not validate a proof of work with an invalid hash but valid amount of zeroes', () => {
        const block = TestBlockProvider.getEmptyBlock(null, 2);
        block.hash = '00wrong_hash'; // Increment the nonce to make the hash invalid

        expect(block.isValidProofOfWork(2)).toBe(false);
    });
});
