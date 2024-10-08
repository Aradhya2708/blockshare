import express from 'express';
import { registerUser, registerNode } from '../controllers/blockchainController.js';

const router = express.Router();

// Route for user registration
router.post('/register', registerUser);

// Route for registering as new Node
router.post('/contribute', registerNode);


export default router;