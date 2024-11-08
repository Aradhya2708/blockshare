import crypto from 'crypto';
import { loadPeerNodes } from '../utils/networkUtils.js';

// Middleware to verify that the request comes from a legitimate node
export const verifyNodeRequest = (req, res, next) => {
    const { ip } = req.ip;

    // Check if all necessary fields are provided
    if (!ip) {
        return res.status(400).json({ message: 'Missing required node details' });
    }

    // Load peer nodes to get the public key of the node making the request
    const peerNodes = loadPeerNodes();
    const registeredNode = peerNodes.find(node => node.ip === ip);

    // Check if the node is registered
    if (!registeredNode ) {
        return res.status(403).json({ message: 'Node is not registered or public key mismatch' });
    }

    // If verification is successful, proceed to the next middleware or route handler
    next();
};

// Helper function to verify the signature
export const verifyNodeSignature = (message, signature, publicKey) => {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(JSON.stringify(message));
    verifier.end();

    try {
        return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
        console.error('Signature verification failed:', error.message);
        return false;
    }
};

export const validateNewNode = (req) => {
    if (!req.body.provided_ip || !req.body.provided_port) {
        return false;
    }
    // validation logic [IPv4, IPv6 check]

    if (req.body.provided_ip != req.ip) {
        return false;
    }
    return true;
}

export const calculateBlockchainLength = (req, res, next) => {
    req.length = getLocalBlockchainLength();
    next();
}
