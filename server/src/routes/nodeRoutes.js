import express from 'express';
import { recieveTxn, recieveBlock, syncBlockchain, syncPeers, pingNode, requestSyncPeers, requestSyncBlockchain } from '../controllers/nodeController.js';
import { verifyNodeRequest, calculateBlockchainLength } from '../middlewares/nodeAuth.js';

const router = express.Router();

// Route for broadcasting transaction with peer node
router.post('/recieve/txn', verifyNodeRequest, recieveTxn);

// Route for recieving block from peer nodes
router.post('/recieve/block', verifyNodeRequest, recieveBlock);

// Route for syncing the blockchain (after mining block)
router.post('/sync/blockchain', verifyNodeRequest, syncBlockchain);

// Route for syncing peer data with peer nodes
router.post('/sync/peers', verifyNodeRequest, syncPeers);

// Ping route to check if node is alive
router.get('/ping', pingNode);

router.post('/request-sync/peers', verifyNodeRequest, requestSyncPeers);

router.post('/request-sync/blockchain', verifyNodeRequest, calculateBlockchainLength, requestSyncBlockchain);

export default router;