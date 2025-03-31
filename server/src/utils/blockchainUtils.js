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

function messageParser(message) {
    try {
        // Extract nonce - handle both quoted and unquoted formats
        let nonceMatch = message.match(/^(?:'([^']+)'|(\d+))/);
        if (!nonceMatch) {
            throw new Error('Invalid nonce format');
        }
        let nonce = nonceMatch[1] || nonceMatch[2]; // Use the captured group that matched

        // Extract the array portion - everything between [ and ]
        let arrayMatch = message.match(/\[(.*)\]/s); // Added 's' flag to match across lines
        if (!arrayMatch) throw new Error('Invalid array format');

        // Split the array string into individual entries and remove trailing comma if exists
        let entries = arrayMatch[1]
            .split(',')
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0);

        // Process each entry
        let result = entries.map(entry => {
            let parts = entry.split(':');
            if (parts.length !== 5) {
                throw new Error(`Invalid entry format: ${entry}`);
            }

            return {
                sender: parts[0],
                recipient: parts[1],
                nonce: parts[2],
                amt: parseInt(parts[3]),
                sign: parts[4]
            };
        });

        return { nonce, result };
    } catch (error) {
        console.error('Error parsing message:', error.message);
        return null;
    }
}

function parseBlock(blockStr) {
    try {
        // Improved regex to handle the entire block format
        const match = blockStr.match(/^([^:]+):(?:'([^']+)'|(\d+)),\[(.*)\]:(\d+):([^:]+)$/s);
        if (!match) {
            throw new Error('Invalid block format');
        }

        const [_, prevBlockHash, quotedNonce, numericNonce, transactionsStr, blockNumber, blockHash] = match;

        // Use either the quoted or numeric nonce
        const nonce = quotedNonce || numericNonce;

        // Reconstruct the message format that messageParser expects
        const message = `${quotedNonce ? `'${nonce}'` : nonce},[${transactionsStr}]`;

        const parsed = messageParser(message);
        if (!parsed) {
            throw new Error('Failed to parse message');
        }

        return {
            prevBlockHash,
            transactions: parsed.result,
            blockNumber: parseInt(blockNumber),
            nonce: parsed.nonce,
            blockHash
        };
    } catch (error) {
        console.error('Error parsing block:', error);
        return null;
    }
}

function stringToBlockchain(input) {
    try {
        // Use a more precise regex to split blocks
        // Look for pattern: ,(?=.+?:.+?,\[) which ensures we only split at block boundaries
        const blockStrings = input
            .split(/,(?=[^,\]]+:[^,\]]+,\[)/)
            .map(str => str.trim())
            .filter(str => str.length > 0);

        // Parse each block
        const blocks = blockStrings
            .map(blockStr => parseBlock(blockStr))
            .filter(block => block !== null);

        if (blocks.length === 0) {
            throw new Error('No valid blocks found');
        }

        return {
            blockchainHeader: {
                blockchainLength: blocks.length
            },
            blocks: blocks
        };
    } catch (error) {
        console.error('Error parsing blockchain:', error);
        return null;
    }
}

// SHOULD FOLLOW THIS FORMAT
// const message = "blockStringsHash1:prevBlockHash1:'nonce1',[abcd:efgh:5:120:sign1,qwer:tyui:6:135:sign2,abcd:efgh:6:170:sign3]:1:Hash1";
//0:0,[0:0:0:0:0,]:1:1// const result = stringToBlockchain(message);

export async function loadBlockchain() {
    const response = await sendCommand(`GET_BLOCKCHAIN`);
    const blockchain = stringToBlockchain(response);
    return blockchain;
}


export const addBlockToBlockchain = async (newBlock) => {

    // const newBlock = { prevBlockHash, transactions, blockNumber, nonce, blockHash }
    const { prevBlockHash, transactions, blockNumber, nonce, blockHash } = newBlock
    // Message is of type string input = "nonce1,[abcd:efgh:5:120:sign1,qwer:tyui:6:135:sign2,abcd:efgh:5:120:sign1]"
    let message = "";
    message += nonce;
    message += ",[";
    for (let i = 0; i < transactions.length; i++) {
        console.log("txn == ", transactions[i]);
        message += transactions[i].sender;
        message += ":";
        message += transactions[i].recipient;
        message += ":";
        message += transactions[i].nonce;
        message += ":";
        message += transactions[i].amt;
        message += ":";
        message += transactions[i].data;
        message += ":";
        message += transactions[i].sign;
        message += ",";
    }
    message += "]";


    const response = await sendCommand(`ADD_BLOCK ${prevBlockHash} ${message} ${blockNumber} ${blockHash}`);
    if (response === "1") console.log("Block Added Successfully");

    return newBlock;
}

export async function getLocalBlockchainLength() {
    const response = await sendCommand(`GET_CONFIRMED_LENGTH`);
    return parseInt(response);
}

export async function getPrevBlockHash() {
    const response = await sendCommand(`GET_LAST_HASH`);
    return response;
}

export async function getBlockNumber() {
    const response = await sendCommand(`GET_LAST_LENGTH`);
    return parseInt(response);
}
