import express from 'express';
import expressWinston from 'express-winston';

import blockchainRoutes from './routes/blockchainRoutes';
import transactionRoutes from './routes/transactionRoutes';
import peerRoutes from './routes/peersRoutes';
import syncRoutes from './routes/syncRoutes';
import balanceRoutes from './routes/balanceRoutes';
import miningRoutes from "./routes/miningRoutes";

import logger from './service/Logger';
import blocksRoutes from './routes/blocksRoutes';
import baseRoutes from './routes/baseRoutes';
import Logger from "./service/Logger";
import BlockchainLifecycleManager from "./service/BlockchainLifecycleManager";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use(
    expressWinston.logger({
        winstonInstance: logger,
        meta: true, // Optional: Including meta info (like request headers, body, etc.)
        msg: 'HTTP {{req.method}} {{req.url}}',
        expressFormat: true, // Use the default Express/morgan format
        colorize: false,
    })
);

// Set up routes
app.use('/blockchain', blockchainRoutes);
app.use('/transactions', transactionRoutes);
app.use('/peers', peerRoutes);
app.use('/sync', syncRoutes);
app.use('/balance', balanceRoutes);
app.use('/blocks', blocksRoutes);
app.use('/mining', miningRoutes);
app.use('/', baseRoutes);

// Start the server
app.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT}`);

    const blockchain = BlockchainLifecycleManager.getInstance().getBlockchain();
    BlockchainLifecycleManager.getInstance().startMiningLoop();

    Logger.info(`Blockchain difficulty: ${blockchain.difficulty}, mining reward: ${blockchain.miningReward}`);
});
