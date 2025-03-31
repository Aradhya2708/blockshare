import express from 'express';
import { registerNode, submitTxn, checkBalanceByAdd, getState, getBlockchainAtTimestamp } from '../controllers/blockchainController.js';

const router = express.Router();

// Route for registering as new Node
router.post('/contribute', registerNode);

// Route for submitting transactions
router.post('/submit-txn', submitTxn);

// Route for getting bc at given ts
router.get('/get-at/:timestamp', getBlockchainAtTimestamp);

// Route for checking balance
router.get('/balance/:address', checkBalanceByAdd);

// Route for getting Blockchain state
router.get('/balance', getState);


// routes for utility in frontend [client only]:
/**
 * create private-key public-key pair
 * sign transactions
 * store nonce
 */


export default router;