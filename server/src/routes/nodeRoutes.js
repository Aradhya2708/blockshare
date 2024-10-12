import express from 'express';
import { broadcastTxn, broadcastBlock, syncBlockchain, syncPeers, pingNode } from '../controllers/nodeController.js';
import { verifyNodeRequest } from '../middlewares/nodeAuth.js';

const router = express.Router();

// Route for broadcasting transaction with peer node
router.post('/broadcast/txn', verifyNodeRequest, broadcastTxn);

// Route for broadcasting block with peer node
router.post('/broadcast/block', verifyNodeRequest, broadcastBlock);

// Route for syncing the blockchain (after mining block)
router.post('/sync/blockchain', verifyNodeRequest, syncBlockchain);

// Route for syncing peer data with peer nodes
router.post('/sync/peers', verifyNodeRequest, syncPeers);

// Ping route to check if node is alive
router.get('/ping', verifyNodeRequest, pingNode);

export default router;