import crypto from 'crypto';
import { getIPv4FromIPv6, loadPeerNodes } from '../utils/networkUtils.js';

// Middleware to verify that the request comes from a legitimate node
export const verifyNodeRequest = (req, res, next) => {
    const ip = req.ip;

    const ipv4 = getIPv4FromIPv6(ip)

    // Check if IP is valid
    if (!ipv4) {
        return res.status(400).json({ message: 'Missing required node details' });
    }

    console.log(ipv4);

    // Load peer nodes
    const peerNodes = loadPeerNodes();
    if (!peerNodes || peerNodes.length === 0) {
        // console.log("peerNodes not found")
        return res.status(500).json({ message: 'Could not load peer nodes' });
    }

    console.log(peerNodes)

    // Check if the node is registered
    const registeredNode = peerNodes.find(node => node.ip === ipv4);
    if (!registeredNode) {
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
