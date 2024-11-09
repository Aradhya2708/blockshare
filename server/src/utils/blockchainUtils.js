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
// !------- COMMANDS FOR INTERACTING WITH BLOCKCHAIN.EXE -------!
function messageParser(message) {
    try {
        // Fix for extracting nonce from the format 'nonce1'
        let nonceMatch = message.match(/'([^']+)'/);
        if (!nonceMatch) {
            console.log('Message being parsed:', message); // Debug log
            throw new Error('Invalid nonce format');
        }
        let nonce = nonceMatch[1];

        // Extract the array portion - everything between [ and ]
        let arrayMatch = message.match(/\[(.*?)\]/); // Made non-greedy with ?
        if (!arrayMatch) throw new Error('Invalid array format');

        // Split the array string into individual entries and filter empty ones
        let entries = arrayMatch[1]
            .split(',')
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0);

        // Process each entry
        let result = entries.map(entry => {
            let parts = entry.split(':');
            if (parts.length !== 5) {
                console.log('Invalid entry:', entry); // Debug log
                throw new Error('Invalid entry format');
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
        // Parse a single block
        const match = blockStr.match(/^([^:]+):('.*?')\,\[(.*?)\]:(\d+):([^:]+)$/);
        if (!match) {
            throw new Error('Invalid block format');
        }

        const [_, prevBlockHash, nonceStr, transactionsStr, blockNumber, blockHash] = match;

        // Reconstruct the message format that messageParser expects
        const message = `${nonceStr},[${transactionsStr}]`;

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
    console.log('Printing String to block input = ', input);
    try {
        // Split the input into individual blocks
        const blockStrings = input.split(/(?<=Hash\d),/);
        console.log('Printing String to block string = ', blockStrings);
        // Parse each block
        const blocks = blockStrings
            .map(blockStr => parseBlock(blockStr.trim()))
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
// const message = "blockStringsHash1,prevBlockHash1:'nonce1',[abcd:efgh:5:120:sign1,qwer:tyui:6:135:sign2,abcd:efgh:6:170:sign3]:1:Hash1";
//0:0,[0:0:0:0:0,]:1:1// const result = stringToBlockchain(message);

export async function loadBlockchain() {
    const response = await sendCommand(`GET_BLOCKCHAIN`);
    const blockchain = stringToBlockchain(response);
    return blockchain;
}


export const addBlockToBlockchain = async (newBlock) => {

    // const newBlock = { prevBlockHash, txns, blockNumber, nonce, hash }
    const { prevBlockHash, txns, blockNumber, nonce, hash } = newBlock
    // Message is of type string input = "nonce1,[abcd:efgh:5:120:sign1,qwer:tyui:6:135:sign2,abcd:efgh:5:120:sign1]"
    let message = "";
    message += nonce;
    message += ",[";
    for (let i = 0; i < txns.length; i++) {
        console.log("txn == ", txns[i]);
        message += txns[i].sender;
        message += ":";
        message += txns[i].recipient;
        message += ":";
        message += txns[i].nonce;
        message += ":";
        message += txns[i].amt;
        message += ":";
        message += txns[i].sign;
        message += ",";
    }
    message += "]";


    const response = await sendCommand(`ADD_BLOCK ${prevBlockHash} ${message} ${blockNumber} ${hash}`);
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
