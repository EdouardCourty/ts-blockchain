import PeerManager from './service/PeerManager';

import * as config from '../configuration.json';
import Logger from "./service/Logger";
import Block from "./model/Block";

class PeersSingleton {
    private static instance: string[]; // List of peer URLs
    private static peerManager = new PeerManager(config.peersFile); // Peer manager for file I/O

    // Ensure that peers are loaded only once and shared across the app
    static getInstance(): string[] {
        if (!PeersSingleton.instance) {
            PeersSingleton.instance = PeersSingleton.peerManager.loadPeers(); // Load peers from file on first call
        }
        return PeersSingleton.instance;
    }

    // Add a peer and update the list in memory and on disk
    static addPeer(peerUrl: string): boolean {
        const peers = PeersSingleton.getInstance(); // Get current peer list
        if (!peers.includes(peerUrl)) {
            peers.push(peerUrl);
            PeersSingleton.peerManager.savePeers(peers); // Save updated peers to disk
            PeersSingleton.instance = peers; // Update in-memory peers
            return true;
        }
        return false; // Peer already exists
    }

    // Remove a peer and update the list in memory and on disk
    static removePeer(peerUrl: string): boolean {
        let peers = PeersSingleton.getInstance(); // Get current peer list
        if (peers.includes(peerUrl)) {
            peers = peers.filter((peer) => peer !== peerUrl);
            PeersSingleton.peerManager.savePeers(peers); // Save updated peers to disk
            PeersSingleton.instance = peers; // Update in-memory peers
            return true;
        }
        return false; // Peer not found
    }

    // Get the list of peers
    static getPeers(): string[] {
        return PeersSingleton.getInstance(); // Always return the current in-memory list
    }

    // Broadcast a new block to all peers
    static async broadcastNewBlock(block: Block): Promise<void> {
        const peers = PeersSingleton.getPeers(); // Use the in-memory peers
        for (const peerUrl of peers) {
            try {
                await PeersSingleton.peerManager.broadcastNewBlock(block); // Delegate to PeerManager
                Logger.info(`Successfully broadcasted block to peer: ${peerUrl}`);
            } catch (error: Error | any) {
                console.error(`Error broadcasting block to peer ${peerUrl}:`, error.message);
            }
        }
    }
}

export default PeersSingleton;
