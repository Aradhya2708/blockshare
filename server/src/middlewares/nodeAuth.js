import crypto from 'crypto';
import { loadPeerNodes } from '../utils/fileUtils';

// Middleware to verify that the request comes from a legitimate node
export const verifyNodeRequest = (req, res, next) => {
    const { ip, port, public_key, sign } = req.body;

    // Check if all necessary fields are provided
    if (!ip || !port || !public_key || !sign) {
        return res.status(400).json({ message: 'Missing required node details' });
    }

    // Load peer nodes to get the public key of the node making the request
    const peerNodes = loadPeerNodes();
    const registeredNode = peerNodes.find(node => node.ip === ip && node.port === port);

    // Check if the node is registered
    if (!registeredNode || registeredNode.public_key !== public_key) {
        return res.status(403).json({ message: 'Node is not registered or public key mismatch' });
    }

    // Verify the signature using the public key
    const isValidSignature = verifySignature({ ip, port }, sign, public_key);

    if (!isValidSignature) {
        return res.status(403).json({ message: 'Invalid signature. Request not authenticated.' });
    }

    // If verification is successful, proceed to the next middleware or route handler
    next();
};

// Helper function to verify the signature
const verifySignature = (message, signature, publicKey) => {
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
