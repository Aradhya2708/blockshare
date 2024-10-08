// for broadcasting to other nodes
import axios from 'axios';

// Ping the node to check if it's alive and functional
export const pingNode = async (ip, port) => {
    try {
        const response = await axios.get(`http://${ip}:${port}/blockchain/ping`);
        return response.status === 200;
    } catch (error) {
        console.error(`Failed to ping node ${ip}:${port}: ${error.message}`);
        return false;
    }
};