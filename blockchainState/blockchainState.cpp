#include <iostream>
#include <string>
#include <vector>
#include <map>
#include <winsock2.h> // Windows sockets library
#include <ws2tcpip.h> // Additional TCP/IP functionality for Windows
#include <chrono>

#pragma comment(lib, "Ws2_32.lib") // Link with Ws2_32.lib
using namespace std;
using namespace std::chrono;


// Temporary Function to do Hashing ## Will be replaced by @Arpans Code
// Just returns same string for now
string sha256(const string& data) {
    return data;
}

// Structure to store vakue pair (amount, nonce)
struct Value {
    int amount;
    int nonce;

    Value(const int amt = 0, const int n = 0) : amount(amt), nonce(n) {}
};


// Base Node for all other nodes (Leaf, Branch etc)
class Node {
public:
    virtual ~Node() = default;
    // Get Hash Function For every Derived Class of Node
    virtual string getHash() const = 0;
};


// Leaf Node (It will have value and the leftover string for user's public key)
class LeafNode : public Node {
public:
    string key;         //To store leftover public key
    Value value;        //To store amount, nonce

    // Constructor to initialize value and string
    LeafNode(const string& k, const Value& v) : key(k), value(v) {}


    // Creates a hash for this node using public key and amount and nonce
    string getHash() const override {
        return sha256(key + to_string(value.amount) + to_string(value.nonce));
    }

};


// Branch Node stores 16 childrens ( 0 to 9 And A TO F )
class BranchNode : public Node {
public:
    Node* children[16]; // 16 childrens based of 0 to F in public Key
    Value* value;      // Optional if it also acts as leaf node

    // Constructor to initialize value and children to null pointers
    BranchNode() : value(nullptr) {
        for (int i = 0; i < 16; i++) {
            children[i] = nullptr;
        }
    }

    // Cleaner (deletes both value and all childer to avoid MEMORY LEAK)
    ~BranchNode() {
        delete value;
        for (int i = 0; i < 16; ++i) {
            delete children[i];
        }
    }

    // Get Hash Function Combines Hashes of all Leaf Nodes Under it
    string getHash() const override {
        string result = "";
        // Gets Hashes of all Childrens
        for (int i = 0; i < 16; ++i) {
            result += (children[i] ? children[i]->getHash() : "");
        }
        // If This Node has a value than it will Also Put its value into Final Hash
        if (value) {
            result += to_string(value->amount) + to_string(value->nonce);
        } else {
            result += "";
        }
        return sha256(result);
    }

    
};


// Extension node: stores a prefix and points to another node // Can Also Store a value
class ExtensionNode : public Node {
public:
    string prefix;
    Node* next;
    Value* value;

    // Constructor to initialize value and next to null pointers
    ExtensionNode(const string& p, Node* n, Value* v = nullptr) : prefix(p), next(n), value(v) {}
    
    // Cleaner (deletes both value and all childer to avoid MEMORY LEAK)
    ~ExtensionNode() {
        delete next;
        delete value;
    }

    // Get Hash Function to point to next and creates its value hash if possible
    string getHash() const override {
        string result = prefix + (next ? next->getHash() : "null");
        if (value) {
            result += to_string(value->amount) + to_string(value->nonce);
        }
        return sha256(result);
    }

};




//THE MAIN MPT CLASS
class MerklePatriciaTree {
private:

    Node* root;


    // ###################### SOME HELPING FUNCTIONS

    // Helper:: Convert a character to its hexadecimal equivalent index // To use this index in string array
    int hexToIndex(char c) {
        if (c >= '0' && c <= '9') return c - '0';
        else if (c >= 'a' && c <= 'f') return c - 'a' + 10;
        return -1;
    }

    // Helper:: Convert a index to its hexadecimal char
    char indexToHexChar(int index) {
        return (index < 10) ? ('0' + index) : ('a' + index - 10);
    }

    // Helper:: Find the longest common prefix between two strings
    string longestCommonPrefix(const string& str1, const string& str2) {
        size_t len = 0;
        while (len < str1.size() && len < str2.size() && str1[len] == str2[len]) {
            ++len;
        }
        return str1.substr(0, len);
    }

    // Helper:: Remove the common prefix from a string
    string removePrefix(const string& str, const string& prefix) {
        return str.substr(prefix.length());
    }

    // DevHelper:: Print the whole tree in trie format
    void visualize(Node* node, const string& prefix = "", bool isTail = true, const string& edgeLabel = "") {
        if (!node) {
            cout << prefix << (isTail ? "└── " : "├── ") << "NULL\n";
            return;
        }

        string nodeInfo;
        string valueInfo;

        if (auto branch = dynamic_cast<BranchNode*>(node)) {
            nodeInfo = "Branch Node";
            if (branch->value) {
                valueInfo = " [Value: " + to_string(branch->value->amount) + ", " + to_string(branch->value->nonce) + "]";
            }
        } else if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            nodeInfo = "Leaf Node [Key: " + leaf->key + "]";
            valueInfo = " [Value: " + to_string(leaf->value.amount) + ", " + to_string(leaf->value.nonce) + "]";
        } else if (auto ext = dynamic_cast<ExtensionNode*>(node)) {
            nodeInfo = "Extension Node [Prefix: '" + ext->prefix + "']";
            if (ext->value) {
                valueInfo = " [Value: " + to_string(ext->value->amount) + ", " + to_string(ext->value->nonce) + "]";
            }
        }

        // Print the current node
        cout << prefix;
        if (!edgeLabel.empty()) {
            cout << (isTail ? "└── " : "├── ") << edgeLabel << " → ";
        }
        cout << nodeInfo << valueInfo << "\n";

        // Prepare the prefix for children
        string newPrefix = prefix + (isTail ? "    " : "│   ");

        // Handle children based on node type
        if (auto branch = dynamic_cast<BranchNode*>(node)) {
            vector<pair<int, Node*>> children;
            for (int i = 0; i < 16; ++i) {
                if (branch->children[i]) {
                    children.push_back({i, branch->children[i]});
                }
            }

            for (size_t i = 0; i < children.size(); ++i) {
                bool isLastChild = (i == children.size() - 1);
                visualize(children[i].second, newPrefix, isLastChild, string(1, indexToHexChar(children[i].first)));
            }
        } else if (auto ext = dynamic_cast<ExtensionNode*>(node)) {
            visualize(ext->next, newPrefix, true, "next");
        }
    }

    // #############################################


    // ###############################MAIN FUNCTIONS

    // Insert a New Value // Updates if it already exists 
    Node* insert(Node* node, const string& key, const Value& value, int depth) {

        // variable: Depth keeps track of current index of public Key
        // if Depth somehow exceeds key length, create a new leaf node with Blank key
        if (depth >= key.length()) {
            if (auto leaf = dynamic_cast<LeafNode*>(node)) {
                leaf->value = value;
                return leaf;
            }
            return new LeafNode("", value);
        }
        
        // Case 1. BASE CASE no node
        // Create a new Leaf Node and return that
        if (!node) {
            return new LeafNode(key.substr(depth), value);
        }

        // Case 2. IF Current Node is a Branch Node
        // Traverse the appropriate branch corresponding to next char in key
        // Recursively traverse and then insert node
        // Return the modified Branch Node
        if (auto branch = dynamic_cast<BranchNode*>(node)) {
            //Traverse
            int charIndex = hexToIndex(key[depth]);
            branch->children[charIndex] = insert(branch->children[charIndex], key, value, depth + 1);
            return branch;
        }

        // Case 3. Current Node is a Leaf Node
        // Handle collisions between leaf nodes
        // Handle if a Leaf Node can be created to a Extension Node
        if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            // To check if public key is already existing
            string existingKey = leaf->key;
            string newKey = key.substr(depth);

            // If the Public Key already exixts
            // Update the value
            if (existingKey == newKey) {
                leaf->value = value;
                return leaf;
            }

            // Checking Common Prefix to check the possibility to a Ext. Node creation
            string commonPrefix = longestCommonPrefix(existingKey, newKey);

            // Clashing

            // No common prefix: create a branch node
            if (commonPrefix.empty()) {
                BranchNode* branch = new BranchNode();
                int oldIndex = hexToIndex(existingKey[0]);
                int newIndex = hexToIndex(newKey[0]);

                // Place the existing leaf into the branch
                branch->children[oldIndex] = new LeafNode(existingKey.substr(1), leaf->value);

                // Insert the new leaf node
                branch->children[newIndex] = new LeafNode(newKey.substr(1), value);

                // Delete Prvs Node
                delete leaf;

                //Return the new Branch Node with Two Leaf Nodes
                return branch;
            } 
            
            // Create an ExtensionNode for the common prefix
            else {
                ExtensionNode* extNode = new ExtensionNode(commonPrefix, nullptr);

                // Get the new Leftover String Values
                string remainingOld = existingKey.substr(commonPrefix.size());
                string remainingNew = newKey.substr(commonPrefix.size());

                // Create Leaf Nodes and Branch Nodes Accordingly
                
                // If both are empty: existing leaf's value replaced and deleted // New ExtensionNode is returned.
                if (remainingOld.empty() && remainingNew.empty()) {
                    extNode->value = new Value(value);
                    delete leaf;
                    return extNode;
                }

                // Creating a new branch Node if Only one is Empty
                BranchNode* branch = new BranchNode();

                // If Only one is empty
                // ExtensionNode keeps existing leaf's value and points to  new LeafNode.
                // Put the new Leaf in Branch Node
                if (remainingOld.empty()) {
                    extNode->value = new Value(leaf->value);
                    int newIndex = hexToIndex(remainingNew[0]);
                    branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);
                } else if (remainingNew.empty()) {
                    extNode->value = new Value(value);
                    int oldIndex = hexToIndex(remainingOld[0]);
                    branch->children[oldIndex] = new LeafNode(remainingOld.substr(1), leaf->value);
                } 
                // If Both Parts Exist
                // Create Leaf Node for each
                // Put in branch node at index
                else {
                    int oldIndex = hexToIndex(remainingOld[0]);
                    int newIndex = hexToIndex(remainingNew[0]);
                    branch->children[oldIndex] = new LeafNode(remainingOld.substr(1), leaf->value);
                    branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);
                }

                // Point to New Branch Created
                extNode->next = branch;

                // Delete original Lead Node
                delete leaf;

                // Return this Extension Node
                return extNode;
            }
        }

        // Case 4. Current Node is an Extension Node
        if (auto extNode = dynamic_cast<ExtensionNode*>(node)) {
            // Get the Longest common Prefix
            string commonPrefix = longestCommonPrefix(extNode->prefix, key.substr(depth));

            // Fully Matches the extension node prefix
            if (commonPrefix == extNode->prefix) {
                if (key.substr(depth + commonPrefix.size()).empty()) {
                    // Means No additional Part in New Key

                    // If value already Exists Update it
                    if (extNode->value) {
                        *(extNode->value) = value;
                    } 
                    // Create a value if no value
                    // Now Extension Node also has a value with it
                    else {
                        extNode->value = new Value(value);
                    }
                } else {
                    // If remaining chars, point to next and recurse
                    extNode->next = insert(extNode->next, key, value, depth + extNode->prefix.size());
                }
                return extNode;
            } else {
                // Split the extension node
                // Create a new ExtensionNode for the common prefix
                ExtensionNode* newExtNode = new ExtensionNode(commonPrefix, nullptr);

                // Remaining parts of the old and new keys
                string remainingOld = removePrefix(extNode->prefix, commonPrefix);
                string remainingNew = removePrefix(key.substr(depth), commonPrefix);

                // Handle Cases

                // If both empty
                // New Extension Node takes Old Value and Old is Deleted
                if (remainingOld.empty() && remainingNew.empty()) {
                    newExtNode->value = new Value(value);
                    newExtNode->next = extNode->next;
                    extNode->next = nullptr;
                    delete extNode;
                    return newExtNode;
                }
                
                // Create a BranchNode to handle the divergence
                BranchNode* branch = new BranchNode();

                // If only one part is empty
                // New Ext. Node takes value of old Ext. Node
                // New Leaf Node for remaining parts
                // Put Leaf Node into Branch Node at its index
                if (remainingOld.empty()) {
                    newExtNode->value = extNode->value;
                    extNode->value = nullptr;
                    int newIndex = hexToIndex(remainingNew[0]);
                    branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);
                    branch->children[16] = extNode->next;
                } else if (remainingNew.empty()) {
                    newExtNode->value = new Value(value);
                    int oldIndex = hexToIndex(remainingOld[0]);
                    if (remainingOld.size() == 1) {
                        branch->children[oldIndex] = extNode->next;
                    } else {
                        branch->children[oldIndex] = new ExtensionNode(remainingOld.substr(1), extNode->next);
                    }
                } 
                // Both parts Exists
                // Split into two leaf nodes
                // Put them into new Branch Node
                else {
                    int oldIndex = hexToIndex(remainingOld[0]);
                    int newIndex = hexToIndex(remainingNew[0]);
                    if (remainingOld.size() == 1) {
                        branch->children[oldIndex] = extNode->next;
                    } else {
                        branch->children[oldIndex] = new ExtensionNode(remainingOld.substr(1), extNode->next);
                    }
                    branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);
                }

                // Set the new extension node's next to the new branch node
                newExtNode->next = branch;
                extNode->next = nullptr;
                delete extNode;
                return newExtNode;
            }
        }

        return nullptr;    // Not able to insert
    }


    // Get value { amount, nonce } for a public key provided
    Value* get(Node* node, const string& key, int depth) {
        // Case 1. BASE CASE no node
        // Return Null
        if (!node) return nullptr;

        // Case 2. Leaf Node
        // Just return the value
        if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            if (leaf->key == key.substr(depth)) {
                return &leaf->value;
            }
        }  

        // Case 3. Branch Node
        // If it has a value return it
        // Point to child and Get Data
        else if (auto branch = dynamic_cast<BranchNode*>(node)) {
            if (depth == key.length()) {
                return branch->value;
            }
            int index = hexToIndex(key[depth]);
            return get(branch->children[index], key, depth + 1);
        } 

        // Case 4. Extension Node
        // If it has a value return it
        // Point to Next and Get Data
        else if (auto extNode = dynamic_cast<ExtensionNode*>(node)) {
            string remainingKey = key.substr(depth);
            if (remainingKey.substr(0, extNode->prefix.size()) == extNode->prefix) {
                if (remainingKey == extNode->prefix) {
                    return extNode->value;
                }
                return get(extNode->next, key, depth + extNode->prefix.size());
            }
        }

        // Not Found
        return nullptr;
    }

    // Returns All Data with { Public Key, Amount, Nonce}
        void getAllData(Node* node, map<string, pair<int, int>>& data, const string& path) {
        // Case 1. BASE CASE no node
        // Return Null
        if (!node) return;

        // Case 2. Leaf Node
        // Just return the value
        if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            data[path + leaf->key] = {leaf->value.amount, leaf->value.nonce};
        }

        // Case 3. Branch Node
        // If it has a value return it
        // Point to child and Get Data
        else if (auto branch = dynamic_cast<BranchNode*>(node)) {
            if (branch->value) {
                data[path] = {branch->value->amount, branch->value->nonce};
            }
            for (int i = 0; i < 16; ++i) {
                if (branch->children[i]) {
                    char hexChar = (i < 10) ? ('0' + i) : ('a' + i - 10);
                    getAllData(branch->children[i], data, path + hexChar);
                }
            }
        }

        // Case 4. Extension Node
        // If it has a value return it
        // Point to Next and Get Data
        else if (auto extNode = dynamic_cast<ExtensionNode*>(node)) {
            if (extNode->value) {
                data[path + extNode->prefix] = {extNode->value->amount, extNode->value->nonce};
            }
            getAllData(extNode->next, data, path + extNode->prefix);
        }
    }

public:

    // Constructor With Root: NULL
    MerklePatriciaTree() : root(nullptr) {}

    // Insert or insert a value
    int insert(const string& key, int amount, int nonce) {
        Value v = {amount, nonce};
        root = insert(root, key, v, 0);
        if (root) {
            return 1;
        } else {
            return 0;
        }
    }

    // Get value for a specific key
    Value* get(const string& key) {
        return get(root, key, 0);
    }

    // Get all data in the tree
    map<string, pair<int, int>> getAllData() {
        map<string, pair<int, int>> data;
        getAllData(root, data, "");
        return data;
    }

    // Visualize the tree
    void visualizeTree() {
        visualize(root);
    }

    // Get Hash of root
    string getHash() const {
        return root ? root->getHash() : sha256("");
    }

    int handleTransaction(string senderPublicKey, string recieverPublicKey, int senderNonce, int amountSent) {
        if (senderPublicKey == "" || recieverPublicKey == "" || !senderNonce) {
            // Incomplete Data
            return -1;
        }
        if (senderPublicKey == recieverPublicKey) {
            // Trying to send to himself
            return -2;
        }
        Value* senderValue = get(senderPublicKey);
        if (senderValue == nullptr) {
            // Sender Public Key Not Found
            return -3;
        }
        if (senderNonce < 0) {
            // Incorrect Nonce
            return -4;
        }
        if (senderNonce != senderValue->nonce + 1) {
            // Nonce Not Matched
            return -5;
        }
        if (amountSent <= 0) {
            // Incorrect Amount Transferring
            return -6;
        } 
        // Not Checking Negative Balance-

        // Subtract Sender's Amount and increase Nonce by 1
        int check = insert(senderPublicKey, senderValue->amount - amountSent, senderValue->nonce + 1);
        if (check < 1) return -7;   // Transaction Failed // Should I add amount back to his account ??

        // Add amount to reciever // Nonce Remains unchanged for reciever
        Value* recieverValue = get(recieverPublicKey);
        // If Reciever Already Exists
        if (recieverValue != nullptr) {
            check = insert(recieverPublicKey, recieverValue->amount + amountSent, recieverValue->nonce);
            if (check < 1) return -7;   // Transaction Failed // Should I add amount back to his account ??
        } else {
            // Create a new user if doesnt exists
            check = insert(recieverPublicKey, amountSent, 0);
            if (check < 1) return -7;   // Transaction Failed // Should I add amount back to his account ??
        }
        


        // Transaction Successful
        return 1;

    }
};


string processCommand(const string& command, MerklePatriciaTree& mpt) {
    if (command.rfind("GET_BY_ADDRESS", 0) == 0) {
        string publickKey = command.substr(15);
        Value* data = mpt.get(publickKey);
        if (data != nullptr) {
            cout << data->amount << data->nonce << endl;
            return (to_string(data->amount) + ":" + to_string(data->nonce));
        }
    } 

    else if (command.rfind("GET_ALL", 0) == 0){
        map<string, pair<int, int>> allData = mpt.getAllData();
        string data = "";
        for (const auto& entry : allData) {
            data += entry.first + ":" + to_string(entry.second.first) + ":" + to_string(entry.second.second) + ",";
        }
        return data;
    }

    else if (command.rfind("EXECUTE", 0) == 0){
        size_t spacePos1 = command.find(" ");
        size_t spacePos2 = command.find(" ", spacePos1 + 1);
        size_t spacePos3 = command.find(" ", spacePos2 + 1);
        size_t spacePos4 = command.find(" ", spacePos3 + 1);

        string senderPublicKey = command.substr(spacePos1+1, spacePos2 - spacePos1 - 1);
        string recieverPublicKey = command.substr(spacePos2 + 1, spacePos3 - spacePos2 - 1);
        string nonce = command.substr(spacePos3 + 1, spacePos4 - spacePos3 - 1);
        string amount = command.substr(spacePos4 + 1);

        int code = mpt.handleTransaction(senderPublicKey, recieverPublicKey, stoi(nonce), stoi(amount));
        return to_string(code);
    }

    else if (command.rfind("GET_STATE_HASH", 0) == 0){
        return mpt.getHash();
    }

    return "UNKNOWN COMMAND\n";
}


//Testing
int main() {

    MerklePatriciaTree mpt;
    mpt.insert("02a0a8ebb0c0eee0d31626cab16f7b5c82e6a93bc58767708310bfe8649f002a7a", 0, 0); //ADMIN ACCOUNT

    // auto start = high_resolution_clock::now();
    // for(int i = 1; i< 1000001; i++){
    //     mpt.handleTransaction("abcd", "efgh", i, 10);
    // }
    // auto stop = high_resolution_clock::now();

    // auto duration = duration_cast<microseconds>(stop - start);

    // cout << "Time taken by function: "
    // << duration.count() << " microseconds" << endl;


    WSADATA wsaData;
    int result = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (result != 0) {
        cerr << "WSAStartup failed: " << result << "\n";
        return 1;
    }

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        cerr << "Socket creation failed\n";
        WSACleanup();
        return 1;
    }

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(8080);

    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        cerr << "Bind failed\n";
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    if (listen(serverSocket, 3) == SOCKET_ERROR) {
        cerr << "Listen failed\n";
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    cout << "Server is listening on port 8080...\n";

    while (true) {
        SOCKET clientSocket = accept(serverSocket, nullptr, nullptr);
        if (clientSocket == INVALID_SOCKET) {
            cerr << "Accept failed\n";
            closesocket(serverSocket);
            WSACleanup();
            return 1;
        }

        char buffer[1024] = {0};
        int bytesRead = recv(clientSocket, buffer, 1024, 0);
        if (bytesRead > 0) {
            string response = processCommand(string(buffer, bytesRead), mpt);
            send(clientSocket, response.c_str(), response.size(), 0);
        }
        
        closesocket(clientSocket); // Close client connection after handling request
    }

    closesocket(serverSocket);
    WSACleanup();
    return 0;
}
