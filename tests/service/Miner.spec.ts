import Miner from "../../src/service/Miner";
// @ts-ignore
import TestBlockProvider from "../support/TestBlockProvider";

// Mock the Logger to avoid logging
jest.mock('../../src/service/Logger');

describe('Miner', () => {
    it('Should mine a block', () => {
        const block = TestBlockProvider.getEmptyBlock();

        const minedBlock = Miner.mineBlock(block, 3);

        expect(minedBlock.hash).toBeDefined();
        expect(minedBlock.hash.substring(0, 3)).toBe('000');
    });
});
