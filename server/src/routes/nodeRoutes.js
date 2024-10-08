import express from 'express';
import { syncUTXO, registerNode, syncPeers, pingNode } from '../controllers/nodeController.js';

const router = express.Router();

// Route for syncing user with peer nodes
router.post('/syncUTXO', syncUTXO);

// Route for syncing peer data with peer nodes
router.post('/syncPeer', syncPeers);

// Ping route to check if node is alive
router.get('/ping', pingNode);

export default router;