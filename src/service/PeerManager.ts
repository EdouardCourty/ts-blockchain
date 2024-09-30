import * as fs from 'fs';
import * as path from 'path';

import * as config from '../../configuration.json';

import Logger from "./Logger";
import Block from "../model/Block";
import httpClient from "./HttpClient";
import Transaction from "../model/Transaction";

class PeerManager {
    private static instance: PeerManager;
    private peers: string[];
    private readonly peersFilePath: string;

    constructor() {
        this.peersFilePath = config.peersFile;
        this.peers = this.loadPeers(); // Load peers when instantiated
    }

    // Singleton pattern: Get the single instance of the PeerManager
    public static getInstance(): PeerManager {
        if (!PeerManager.instance) {
            PeerManager.instance = new PeerManager();
        }
        return PeerManager.instance;
    }

    // Load peers from the JSON file
    private loadPeers(): string[] {
        if (fs.existsSync(this.peersFilePath)) {
            const rawData = fs.readFileSync(this.peersFilePath, 'utf8');
            return JSON.parse(rawData);
        } else {
            return [];
        }
    }

    // Save peers to the JSON file
    private savePeers(): void {
        const peerData = JSON.stringify(this.peers, null, 4);
        const dir = path.dirname(this.peersFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.peersFilePath, peerData, 'utf8');
    }

    // Add a peer and update the list in memory and on disk
    public addPeer(peerUrl: string): boolean {
        if (!this.peers.includes(peerUrl)) {
            this.peers.push(peerUrl);
            this.savePeers();  // Save peers to file after adding
            Logger.info(`Peer added: ${peerUrl}`);
            return true;
        }
        Logger.info(`Peer already exists: ${peerUrl}`);
        return false;
    }

    // Remove a peer and update the list in memory and on disk
    public removePeer(peerUrl: string): boolean {
        if (this.peers.includes(peerUrl)) {
            this.peers = this.peers.filter((peer) => peer !== peerUrl);
            this.savePeers();  // Save peers to file after removal
            Logger.info(`Peer removed: ${peerUrl}`);
            return true;
        }
        Logger.info(`Peer not found: ${peerUrl}`);
        return false;
    }

    // Get the list of peers
    public getPeers(): string[] {
        return this.peers;
    }

    // Broadcast a new block to all peers
    public async broadcastNewBlock(block: Block): Promise<void> {
        for (const peerUrl of this.peers) {
            try {
                await httpClient.post(`${peerUrl}/blocks`, block.toJSON());
                Logger.info(`Successfully broadcasted block to peer: ${peerUrl}`);
            } catch (error: any) {
                Logger.error(`Error broadcasting block to peer ${peerUrl}: ${error.message} - ${JSON.stringify(error.response?.data)}`);
            }
        }
    }

    public async broadcastNewTransaction(transaction: Transaction): Promise<void> {
        for (const peerUrl of this.peers) {
            try {
                await httpClient.post(`${peerUrl}/transactions`, {
                    ...transaction.toJSON(),
                    isBroadcast: true
                });
                Logger.info(`Successfully broadcasted transaction to peer: ${peerUrl}`);
            } catch (error: any) {
                Logger.error(`Error broadcasting transaction to peer ${peerUrl}: ${error.message} - ${JSON.stringify(error.response?.data)}`);
            }
        }
    }
}

export default PeerManager;
