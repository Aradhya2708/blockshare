import crypto from 'crypto';
import { getIPv4FromIPv6, loadPeerNodes } from '../utils/networkUtils.js';
import { getLocalBlockchainLength } from '../utils/blockchainUtils.js';

// Middleware to verify that the request comes from a legitimate node
export const verifyNodeRequest = (req, res, next) => {
    try {
        const ip = req.ip;

        // Extract IPv4 address from potential IPv6 format
        const ipv4 = getIPv4FromIPv6(ip);

        // Check if IP is valid
        if (!ipv4) {
            console.error('Error: Missing required node details - invalid IP address');
            return res.status(400).json({ message: 'Missing required node details' });
        }

        console.log(`Incoming request from IP: ${ipv4}`);

        // Load peer nodes
        let peerNodes;
        try {
            peerNodes = loadPeerNodes();
            if (!peerNodes || peerNodes.length === 0) {
                console.error('Error: Could not load peer nodes');
                return res.status(500).json({ message: 'Could not load peer nodes' });
            }
        } catch (error) {
            console.error('Error loading peer nodes:', error);
            return res.status(500).json({ message: 'Failed to load peer nodes' });
        }

        console.log('Loaded peer nodes:', peerNodes);

        // Check if the node is registered
        const registeredNode = peerNodes.find(node => node.ip === ipv4);
        if (!registeredNode) {
            console.error(`Error: Node is not registered or public key mismatch for IP: ${ipv4}`);
            return res.status(403).json({ message: 'Node is not registered or public key mismatch' });
        }

        // If verification is successful, proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error('Unexpected error in verifyNodeRequest:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
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
