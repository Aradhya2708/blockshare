import express from 'express';
import { broadcastTxn, broadcastBlock, syncBlockchain, syncPeers, pingNode } from '../controllers/nodeController.js';

const router = express.Router();

// Route for broadcasting transaction with peer node
router.post('/broadcast/txn', broadcastTxn);

// Route for broadcasting block with peer node
router.post('/broadcast/block', broadcastBlock);

// Route for syncing the blockchain (after mining block)
router.post('/sync/blockchain', syncBlockchain);

// Route for syncing peer data with peer nodes
router.post('/sync/peers', syncPeers);

// Ping route to check if node is alive
router.get('/ping', pingNode);

export default router;