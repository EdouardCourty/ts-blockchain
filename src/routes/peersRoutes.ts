import { Router } from 'express';
import PeersSingleton from '../PeersSingleton';

const router = Router();

// POST /peers - Add a peer node
router.post('/', (req, res) => {
    const { peerUrl } = req.body;

    if (!peerUrl) {
        return res.status(400).json({ error: 'Peer URL is required' });
    }

    const added = PeersSingleton.addPeer(peerUrl);

    if (added) {
        res.json({ message: 'Peer added successfully', peers: PeersSingleton.getPeers() });
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

    const removed = PeersSingleton.removePeer(peerUrl);

    if (removed) {
        res.json({ message: 'Peer removed successfully', peers: PeersSingleton.getPeers() });
    } else {
        res.status(400).json({ error: 'Peer not found' });
    }

    return res.end();
});

// GET /peers - Retrieve all peers
router.get('/', (_, res) => {
    const peers = PeersSingleton.getPeers();
    res.json({ peers });

    return res.end();
});

export default router;
