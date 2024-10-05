import { Router } from 'express';
import PeerManager from "../service/PeerManager";

const router = Router();

// POST /peers - Add a peer node
router.post('/', (req, res) => {
    const { peerUrl } = req.body;

    if (!peerUrl) {
        return res.status(400).json({ error: 'Peer URL is required' });
    }

    const added = PeerManager.getInstance().addPeer(peerUrl);

    if (added) {
        res.json({ message: 'Peer added successfully', peers: PeerManager.getInstance().getPeers() });
    } else {
        res.status(400).json({ error: 'Peer already exists' });
    }

    return res.end();
});

// DELETE /peers - Remove a peer node
router.delete('/', (req, res) => {
    const { peerUrl } = req.body;

    if (!peerUrl) {
        return res.status(400).json({ error: 'Peer URL is required' });
    }

    const removed = PeerManager.getInstance().removePeer(peerUrl);

    if (removed) {
        res.json({ message: 'Peer removed successfully', peers: PeerManager.getInstance().getPeers() });
    } else {
        res.status(400).json({ error: 'Peer not found' });
    }

    return res.end();
});

// GET /peers - Retrieve all peers
router.get('/', (_, res) => {
    const peers = PeerManager.getInstance().getPeers();
    res.json({ peers });

    return res.end();
});

export default router;
