import "dotenv/config"
import app from './app.js'

const sync = () => {
    console.log(`Syncing Node...`);

    // 1. ask peers from peers

    // 2. get longest blockchain (only array of blocks)
    // for(peer in peers){
    //    axios requestSyncBlockchain(){
    //      req.body.port = process.env.PORT 
    // }

    // 3. build blockchain step by step
    // for(int i=0; i<blockchain.length; i++){
    //     verifyBlock(blockchain[i]);
    //     addBlockToBlockchain(blockchain[i]);
    // }

}

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
    // console.log(`For Blockchain Genesis, add IP and Port in peers.json`);

    // sync();

    // setInterval(sync, 3600000); // 3600000 ms = 1 hour
});