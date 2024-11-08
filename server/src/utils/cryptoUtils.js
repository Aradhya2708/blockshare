// for cryptographic operations (signing, hashing) [NEEDS EXTENSIVE CHANGES]

import crypto from 'crypto';
import { loadMempool } from './mempoolUtils.js';
import { getBlockNumber, getPrevBlockHash } from './blockchainUtils.js';
import net from "net";

function sendCommand(command) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.connect(8080, process.env.IP, () => {
            console.log(`Connected`)
            client.write(command);
        });

        client.on('data', (data) => {
            resolve(data.toString());
            client.destroy(); // close the connection after receiving data
        });

        client.on('error', (err) => {
            reject(err);
        });
    });
}


// Save the blockchain state
export async function saveBlockchainState(state) {

}



// Verify nonce (ensure the transaction is in correct order)
// CPP Function for Server
export async function verifyNonce(sender, nonce) {
    const res = await getStateOfAddress(sender)
    if (parseInt(res.nonce) === parseInt(nonce) - 1) {
        return true;
    }

    return false;
}

export async function getBalanceByAddress(address) {
    const balance = 0; // CPP function
    return balance;
}

// !------- COMMANDS FOR INTERACTING WITH BLOCKCHAINSTATE.EXE -------!

// Load the current blockchain state
export async function loadBlockchainState() {
    const response = await sendCommand(`GET_ALL`)
    const state = response.split(',').map(entry => ({
        [entry.split(':')[0]]: {
            balance: entry.split(':')[1],
            nonce: entry.split(':')[2]
        }
    }));
    return state;
}

export async function getStateOfAddress(address) {
    const response = await sendCommand(`GET_BY_ADDRESS ${address}`);
    // "12:16" [CHECK]
    const nonce = response.split(":")[1];
    const balance = response.split(":")[0];

    return { balance, nonce };
}

// // CPP Function for Server



// Block utils

export function verifyBlock(block) {

    const data = `${block.prevBlockHash}${block.transactions}${block.blockNumber}${block.nonce}`
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

    return hash === block.blockHash;
}

export const mineBlock = async () => {

    const mempool = loadMempool();
    const prevBlockHash = await getPrevBlockHash();
    const blockNumber = await getBlockNumber() + 1;
    const data = `${prevBlockHash}${mempool}${blockNumber}`
    const { nonce, blockHash } = await getNonceAndHash(JSON.stringify(data));
    const newBlock = { prevBlockHash, mempool, blockNumber, nonce, blockHash };
    return newBlock;
}

// CPP function [MINING]
async function getNonceAndHash(message) {
    // message + 0 = 0000hash 
}
