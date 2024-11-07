import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOCKCHAIN_FILE = path.join(__dirname, '../localdb/blockchain.json')


export function loadBlockchain() {
    try {
        const data = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');
        const blockchain = JSON.parse(data);
        return blockchain;
    } catch (error) {
        console.error('Error loading blockchain:', error.message);
        return null; // or handle error as needed
    }
}

export function saveBlockchain(blockchain) {
    // remove existing make new
    try {
        fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchain, null, 2));
        console.log('Blockchain saved successfully.');
    } catch (error) {
        console.error('Error saving blockchain:', error.message);
    }
}

export const addBlockToBlockchain = (newBlock) => {
    // open local blockchain

    const blockchain = loadBlockchain();

    if (blockchain) {
        // add block
        blockchain.blocks.push(newBlock);

        // save
        saveBlockchain(blockchain);
        console.log('New block added to the blockchain successfully.');
    } else {
        console.error('Failed to load blockchain to add new block.');
    }
}

export const verifyBlockchain = (blockchain) => {
    if (!blockchain || !Array.isArray(blockchain.blocks) || blockchain.blocks.length === 0) {
        return false; // Invalid blockchain
    }

    for (let i = 1; i < blockchain.blocks.length; i++) {
        const currentBlock = blockchain.blocks[i];
        const previousBlock = blockchain.blocks[i - 1];

        // Check if the previous hash matches the hash of the previous block
        if (currentBlock.prevBlockHash !== previousBlock.blockhash) {
            console.error(`Blockchain is invalid: Block ${i} has incorrect previous hash.`);
            return false;
        }

        // Optionally: You can add more checks here (e.g., verify block hash, nonce, etc.)
    }
    return true; // Blockchain is valid
}

export function getLocalBlockchainLength() {
    const blockchain = loadBlockchain();
    if (blockchain) {
        return blockchain.blockchainHeader.blockchainLength;
    }
    else {
        console.error(`Failed to load Blockchain`)
    }
}

export function getPrevBlockHash() {
    const blockchain = loadBlockchain();
    if (blockchain) {
        return blockchain.blocks[blockchain.blockchainHeader.blockchainLength].blockHash;
    }
    else {
        console.error(`Failed to load Blockchain`)
    }
}

export function getBlockNumber() {
    const blockchain = loadBlockchain();
    if (blockchain) {
        return blockchain.blocks[blockchain.blockchainHeader.blockchainLength].blockNumber;
    }
    else {
        console.error(`Failed to load Blockchain`)
    }
}
