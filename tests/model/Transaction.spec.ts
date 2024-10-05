import Transaction from '../../src/model/Transaction';

describe('Transaction', () => {
    it('should create a transaction with the correct properties', () => {
        const fromAddress = 'address';
        const toAddress = 'address2';
        const amount = 100;
        const type = 'REGULAR';
        const timestamp = new Date().toISOString();

        const transaction = new Transaction(fromAddress, toAddress, amount, type, timestamp);

        expect(transaction.fromAddress).toBe(fromAddress);
        expect(transaction.toAddress).toBe(toAddress);
        expect(transaction.amount).toBe(amount);
        expect(transaction.signature).toBe('');
        expect(transaction.type).toBe(type);
        expect(transaction.timestamp).toBe(timestamp);
    });

    it('should calculate a valid hash', () => {
        const fromAddress = '04bc64f01e4a8ecf67e3d8eb0a4e517576e6a897d7d867680c0d8a2f4c8418d19fa905c6530218d0e489d9a50dfc281eaa544f1de33ecf693f1943eecdef4595e8';
        const toAddress = 'address2';
        const amount = 100;

        const transaction = new Transaction(fromAddress, toAddress, amount, 'REGULAR', 'now');
        const hash = transaction.calculateHash();

        // Check that the hash is a valid SHA-256 hash (64 characters long)
        expect(hash).toHaveLength(64);
    });

    it('should throw an error when the transaction is not signed', () => {
        const fromAddress = '04bc64f01e4a8ecf67e3d8eb0a4e517576e6a897d7d867680c0d8a2f4c8418d19fa905c6530218d0e489d9a50dfc281eaa544f1de33ecf693f1943eecdef4595e8';
        const toAddress = 'address2';
        const amount = 100;

        const transaction = new Transaction(fromAddress, toAddress, amount, 'REGULAR', 'now');

        // Attempt to validate without a signature
        expect(() => transaction.isValid()).toThrow('No signature in this transaction');
    });

    it('should handle reward transactions (no fromAddress)', () => {
        const toAddress = 'minerAddress';
        const amount = 50;

        const transaction = new Transaction(null, toAddress, amount, 'REWARD', 'now');

        // Reward transactions with no fromAddress should always be valid
        expect(transaction.isValid()).toBe(true);
    });

    it('should throw when using a wrong public key as address', () => {
        const transaction = new Transaction('wrongAddress', 'address2', 100, 'REGULAR', 'now');

        expect(() => transaction.isValid()).toThrow();
    });
});
