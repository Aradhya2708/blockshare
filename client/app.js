const express = require('express');
const app = express();
const UserModel = require("./models/user");
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbgr = require("debug")("development:server");
const axios = require('axios');
const bodyParser = require('body-parser')
const { generateKeyPair, createSignature, verifySignature } = require('./utils/ellipticUtils.cjs');


app.set("view engine", "ejs");
app.use(bodyParser.json())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get('/', function (req, res) {
    dbgr("GET / - Rendering home page");
    res.render("index");
});

app.get('/profile', isLoggedIn, async function (req, res) {
    try {
        dbgr("GET /profile - Checking logged in user");
        let user = await UserModel.findOne({ email: req.user.email });
        dbgr("User found: ", user);
        res.render("profile", { user });
    } catch (err) {
        dbgr("Error in /profile route: ", err);
        res.status(500).send("Error loading profile.");
    }
});

app.post('/register', async function (req, res) {
    let { username, email, password } = req.body;
    dbgr("POST /register - Registering user with email:", email);

    try {
        let user = await UserModel.findOne({ email });
        if (user) {
            dbgr("User already exists: ", email);
            return res.status(400).send("User Already Registered");
        }

        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                dbgr("Error generating salt: ", err);
                return res.status(500).send("Error registering user.");
            }

            bcrypt.hash(password, salt, async function (err, hash) {
                if (err) {
                    dbgr("Error hashing password: ", err);
                    return res.status(500).send("Error registering user.");
                }

                let user = await UserModel.create({
                    username,
                    email,
                    password: hash
                });
                dbgr("User created successfully:", user);

                let token = jwt.sign({email, userid: user._id }, "secret");
                res.cookie("token", token);
                dbgr("Token generated and stored in cookie for:", email);
                res.redirect('/');
            });
        });
    } catch (err) {
        dbgr("Error in /register route: ", err);
        res.status(500).send("Error registering user.");
    }
});

app.post('/login', async function (req, res) {
    let { email, password } = req.body;
    dbgr("POST /login - Logging in user with email:", email);

    try {
        let user = await UserModel.findOne({ email });
        if (!user) {
            dbgr("User not found:", email);
            return res.status(400).send("Invalid credentials.");
        }

        bcrypt.compare(password, user.password, function (err, result) {
            if (err || !result) {
                dbgr("Password mismatch or error:", err);
                return res.status(400).send("Invalid credentials.");
            }

            let token = jwt.sign({ email, userid: user._id }, "secret");
            res.cookie("token", token);
            dbgr("Token generated and stored in cookie for:", email);
            res.redirect('/profile');
        });
    } catch (err) {
        dbgr("Error in /login route: ", err);
        res.status(500).send("Error logging in.");
    }
});

app.post('/logout', (req, res) => {
    dbgr("POST /logout - Logging out user");
    res.redirect('/logout');
});

app.get('/logout', (req, res) => {
    dbgr("GET /logout - Clearing cookie and redirecting to home page");
    res.cookie("token", "");
    res.redirect('/');
});

app.post('/generate-keys', (req, res) => {
    try {
        // Generate keys using the utility function
        const keys = generateKeyPair();

        // Send the keys as a JSON response
        res.json({ publicKey: keys.publicKey, privateKey: keys.privateKey });
    } catch (error) {
        console.error("Error generating keys:", error);
        res.status(500).json({ error: "Failed to generate keys." });
    }
});

app.post('/sign-transaction', (req, res) => {
    const { sender, recipient, amt, nonce, privateKey} = req.body;
    try {
        const signature = createSignature(sender, recipient, amt, nonce, privateKey);
        console.log(signature);
        res.json({ signature, sender});
    } catch (error) {
        console.error("Error creating signature:", error);
        res.status(500).json({ error: "Failed to create signature." });
    }
});

app.post('/verify-signature', (req, res) => {
    const {sender, recipient, amt, nonce, sign} = req.body;

    try {
        // Verify the signature using the provided data
        const isValid = verifySignature(sender, recipient, amt, nonce, sign);
        res.json({ isValid });
    } catch (error) {
        console.error("Error verifying signature:", error);
        res.status(500).json({ error: "Failed to verify signature." });
    }
});

app.post('/submit-txn', async (req, res) => {
    try {
        // Extract data from the request body
        const { sender, recipient, nonce, amt, sign} = req.body;

        console.log(sender);
        console.log(recipient);
        console.log(nonce);
        console.log(amt);
        console.log(sign);

        // Construct the transaction object
        const transactionData = {
            sender,         // Sender's public key
            recipient,     // Receiver's public key
            nonce,                           // Transaction nonce
            amt,                          // Transaction amount
            sign                        // Digital signature
        };
        // Replace <node-ip> with the actual IP address or URL of your node
        const nodeUrl = 'http://172.31.117.127:8000/blockchain/submit-txn';

        // Make a POST request to the node
        const response = await axios.post(nodeUrl, transactionData);
        res.json({ message: 'Transaction submitted successfully', data: response.data });
    } catch (error) {
        console.error("Error submitting transaction:", error);
        res.status(500).json({ error: "Failed to submit transaction." });
    }
});

app.post('/contribute', async (req, res) => {
    try {
        // Extract data from the request body
        const { provided_port } = req.body;
        
        if (!provided_port) {
            return res.status(400).json({ error: "Port is required" });
        }

        // Construct the data object to send
        const providedPort = { provided_port};

        // Make the Axios POST request with the correct data
        const nodeUrl = 'http://172.31.117.127:8000/blockchain/contribute';
        const response = await axios.post(nodeUrl, providedPort, {
            headers: { 'Content-Type': 'application/json' } // Use the correct content type
        });

        // Respond back to the client with the node's response
        res.json({ message: 'Contribute request submitted successfully', data: response.data });
    } catch (error) {
        console.error("Error submitting contribute request:", error);
        res.status(500).json({ error: "Failed to submit contribute request." });
    }
});


app.post('/balance', async (req, res) => {
    const { address } = req.body; // Extract the address from the request body

    if (!address) {
        return res.status(400).json({ error: "Address is required." });
    }

    try {
        const nodeUrl = `http://172.31.117.127:8000/blockchain/balance/${address}`;
        const response = await axios.get(nodeUrl);
        res.json({ balance: response.data.balance });
    } catch (error) {
        console.error("Error fetching balance:", error);
        res.status(500).json({ error: "Failed to fetch balance." });
    }
});

function isLoggedIn(req, res, next) {
    dbgr("Middleware isLoggedIn - Checking if user is logged in");

    if (!req.cookies.token) {
        dbgr("No token found, redirecting to login");
        return res.redirect('/login');
    }

    try {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        dbgr("Token verified, user:", data);
        next();
    } catch (err) {
        dbgr("Token verification failed:", err);
        res.redirect('/login');
    }
}

app.listen(3000, () => {
    dbgr("Server started on http://localhost:3000");
});
