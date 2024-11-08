// !------- COMMANDS FOR INTERACTING WITH BLOCKCHAIN.EXE -------!


export async function loadBlockchain() {
    // try {
    //     const data = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');
    //     const blockchain = JSON.parse(data);
    //     return blockchain;
    // } catch (error) {
    //     console.error('Error loading blockchain:', error.message);
    //     return null; // or handle error as needed
    // }
}

export async function saveBlockchain(blockchain) {
    // remove existing make new
    // try {
    //     fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(blockchain, null, 2));
    //     console.log('Blockchain saved successfully.');
    // } catch (error) {
    //     console.error('Error saving blockchain:', error.message);
    // }
}

export const addBlockToBlockchain = async (newBlock) => {
    // open local blockchain

    // const blockchain = loadBlockchain();

    // if (blockchain) {
    //     // add block
    //     blockchain.blocks.push(newBlock);

    //     // save
    //     saveBlockchain(blockchain);
    //     console.log('New block added to the blockchain successfully.');
    // } else {
    //     console.error('Failed to load blockchain to add new block.');
    // }

    // to blockchain.exe
}

export async function getLocalBlockchainLength() {
    // const blockchain = loadBlockchain();
    // if (blockchain) {
    //     return blockchain.blockchainHeader.blockchainLength;
    // }
    // else {
    //     console.error(`Failed to load Blockchain`)
    // }

    // to blockchain.exe
}

export async function getPrevBlockHash() {
    // const blockchain = loadBlockchain();
    // if (blockchain) {
    //     return blockchain.blocks[blockchain.blockchainHeader.blockchainLength].blockHash;
    // }
    // else {
    //     console.error(`Failed to load Blockchain`)
    // }

    // to blockchain.exe
}

export async function getBlockNumber() {
    // const blockchain = loadBlockchain();
    // if (blockchain) {
    //     return blockchain.blocks[blockchain.blockchainHeader.blockchainLength].blockNumber;
    // }
    // else {
    //     console.error(`Failed to load Blockchain`)
    // }

    // return height of leftmost branch
}
