import express from 'express';
import bodyParser from 'body-parser';

import blockchainRoutes from './routes/blockchainRoutes.js';
import nodeRoutes from './routes/nodeRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';

const app = express();

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/blockchain', blockchainRoutes);
app.use('/nodes', nodeRoutes);
app.use('/transactions', transactionRoutes);

export default app;


/*
example requests

to register yourself as node
    send POST request 
    {
        nodeName,
        ip,
        port
    }
    over
    http://<node_ip>:<node_port>/blockchain/contribute 


to register yourself as user
    send POST request
    {
        username,
        public_key
    }
    over
    http://<node_ip>:<node_port>/blockchain/register
*/


// whenever a node starts, it should sync with the current data