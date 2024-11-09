#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <memory>
#include <unordered_map>
#include <algorithm>  // Include this for std::max_element and std::find
#include <map>
#include <winsock2.h> // Windows sockets library
#include <ws2tcpip.h> // Additional TCP/IP functionality for Windows
#include <chrono>
#include <regex>


using namespace std;
using namespace std::chrono;
#pragma comment(lib, "Ws2_32.lib") // Link with Ws2_32.lib

// GLOBAL VARIABLES
int k = 2;           // The K number of above parents that have to have number(child) == 1 to it to be confirmed  
int m = 2;           // Minimum Difference of lengths of two forks Before the smaller one can be deleted 

void executeWholeBlockTransactions(string input);



// Temporary Function to do Hashing ## Will be replaced by @Arpans Code
// Just returns same string for now
string sha256(const string& data) {
    return data;
}


// FOR BLOCKCHAIN
// Define the Block structure
class Block {
public:
    string prevHash;
    string message;
    int blockNumber;
    string hash;
    vector<shared_ptr<Block>> children;
    shared_ptr<Block> parent;

    Block(string prevHash, string message, int blockNumber, string hash)
        : prevHash(prevHash), message(message), blockNumber(blockNumber), hash(hash) {}
};



class Blockchain {
public:
    unordered_map<int, vector<shared_ptr<Block>>> levels; // Blocks stored by level
    vector<shared_ptr<Block>> confirmedBlockchain;

    int confirmedLength;
    string lastHash;
    bool isGenesisAdded = false;

    shared_ptr<Block> Genesis;

    Blockchain() {
        // Create and add the genesis block when the blockchain is initialized
       
        confirmedLength = 0;

        auto genesisBlock = make_shared<Block>("0", "a", 1, "1");
        addBlock(genesisBlock);
        Genesis = genesisBlock;
        confirmedBlockchain.push_back(genesisBlock);
        levels[0].push_back(genesisBlock);

    }

    void addBlock(shared_ptr<Block> newBlock) {

        if (newBlock->prevHash == "0" and !isGenesisAdded) {
            // Genesis block has no parent, just add it to the blockchain
            cout << "Genesis Block added: " << newBlock->hash << endl;
            isGenesisAdded = true;
            return;
        } 
        
        int level = newBlock->blockNumber;
        cout << "lvl of block = " << level << endl;

        vector<shared_ptr<Block>> level_to_check = levels[level-2];

        cout << level_to_check.size() << endl;

        for(int i=0; i<level_to_check.size(); i++){
            shared_ptr<Block> block = level_to_check[i];

            cout << "checking block = " << block->hash << endl;
            cout << "my hash = " << newBlock->prevHash << endl;

            if(block->hash == newBlock->prevHash) {
                if (block->children.size() == 0 ) {
                    block->children.push_back(newBlock);
                    newBlock->parent = block;
                    cout << "newBlock added to block : " << block->hash;
                    cout << "\nparent now has children : ";
                    for (int i = 0; i < block->children.size(); i++) {
                        cout << block->children[i]->hash;
                    }
                    cout << "adding to level = " <<block->blockNumber<< endl;
                    levels[block->blockNumber].push_back(newBlock);
                    cout << endl;

                    resolveFork(newBlock);
                    isConfirmed(block);
                    
                    return;

                }
                else if (block->children.size() > 0){
                    if(!isConfirmed(block->children[0])){
                        block->children.push_back(newBlock);
                        newBlock->parent = block;
                        cout << "newBlock added to block : " << block->hash;
                        cout << "\nparent now has children : ";
                        for (int i = 0; i < block->children.size(); i++) {
                            cout << block->children[i]->hash;
                        }
                        cout << "adding to level = " <<block->blockNumber<< endl;
                        levels[block->blockNumber].push_back(newBlock);
                        cout << endl;

                        resolveFork(newBlock);
                        isConfirmed(block);

                        
                        return;
                    }
                } 
            }
        }


        cout << "No Parent Found\n";
        return;
        
    }

    bool isConfirmed(shared_ptr<Block> block) {
        // Check if the block is already confirmed
        for (const auto &confirmedBlock : confirmedBlockchain) {
            if (confirmedBlock == block) {
                return true;  // Block is already confirmed
            }
        }

        // Check if the parent block is confirmed
        if (block->parent != nullptr && !isConfirmed(block->parent)) {
            return false;  // Block cannot be confirmed if the parent is not confirmed
        }

        // Check if the chain is linear for k steps (i.e., each block has only one child)
        shared_ptr<Block> tempBlock = block;
        for (int i = 0; i < k; i++) {
            if (tempBlock->children.size() != 1) {
                return false;  // If any block in the chain has more than one child, it's not a linear chain
            }
            tempBlock = tempBlock->children[0];  // Move to the next child
            if (tempBlock->parent == nullptr) {
                break;  // If we reached the end of the chain (no parent), stop checking
            }
        }

        // If all checks passed, confirm the block and add it to the confirmed blockchain
        // Aslo Execute its transactions
        confirmedBlockchain.push_back(block);      
        cout << "executing : " << block->message << endl;
        executeWholeBlockTransactions(block->message);
        confirmedLength++;
        return true;
    }

    shared_ptr<Block> getLastBlock(){
        shared_ptr<Block> tempBlock = Genesis;
        cout << "genesis = " << tempBlock->hash << endl;

        // Traverse until the last block
        while (!tempBlock->children.empty() && tempBlock->children[0] != nullptr) {
            tempBlock = tempBlock->children[0];
        }

        return tempBlock;
    }

    string getLastHash(){
        shared_ptr<Block> block = getLastBlock();
        return block->hash;
    }

    string getLastLength() {
        shared_ptr<Block> block = getLastBlock();
        int len = block->blockNumber;
        return to_string(len);
    } 


    void resolveFork(shared_ptr<Block> block) {
        if (block->children.size() <= 1) {
            cout << "No fork detected. Block " << block->hash << " has " << block->children.size() << " children.\n";
            if(block->parent != nullptr)
                // if(isConfirmed(block->parent))
                //      return; // found confirmed blockchain
                resolveFork(block->parent);
            return;  // No fork, nothing to resolve
        }

        // Vector to store the length of the chains for each child
        vector<pair<shared_ptr<Block>, int>> childChainLengths;

        cout << "Resolving fork for block " << block->hash << ". It has " << block->children.size() << " children.\n";

        // Calculate the length of the chain for each child block
        for (const auto &child : block->children) {
            int chainLength = calculateChainLengthDFS(child);
            childChainLengths.push_back({child, chainLength});
            cout << "Child " << child->hash << " has a chain length of " << chainLength << ".\n";
        }

        // Find the child with the longest chain
        auto longestChainChild = *max_element(childChainLengths.begin(), childChainLengths.end(),
                                                [](const pair<shared_ptr<Block>, int> &a, const pair<shared_ptr<Block>, int> &b) {
                                                    return a.second < b.second;
                                                });

        cout << "The longest chain is from child " << longestChainChild.first->hash << " with length " << longestChainChild.second << ".\n";

        // Loop through the children and prune the ones with shorter chains
        for (const auto &childLengthPair : childChainLengths) {
            if (childLengthPair.second < longestChainChild.second - m) {
                // Prune the shorter child
                cout << "child has length = " << childLengthPair.second << " while largest is =" << longestChainChild.second << endl;
                cout << "Pruning child " << childLengthPair.first->hash << " as its chain length is shorter.\n";
                pruneChild(block, childLengthPair.first);
            } else {
                cout << "Keeping child " << childLengthPair.first->hash << " as it is in conflicted range.\n";
            }
        }

        // if(isConfirmed(block->parent))
        //     return; // found confirmed blockchain

        resolveFork(block->parent);
    }


    // Helper function to calculate the longest chain length starting from a block using DFS
    int calculateChainLengthDFS(shared_ptr<Block> block) {
        if (block->children.empty()) {
            // Base case: if no children, the length is 1 (the block itself)
            return 1;
        }

        int maxLength = 0;
        for (const auto &child : block->children) {
            // Recursively calculate the chain length for each child
            int childChainLength = calculateChainLengthDFS(child);
            maxLength = max(maxLength, childChainLength);  // Keep track of the longest chain
        }

        // Include the current block in the length
        return maxLength + 1;
    }


    // Helper function to prune a child block from its parent's children
    void pruneChild(shared_ptr<Block> parent, shared_ptr<Block> child) {
        auto &children = parent->children;
        auto it = find(children.begin(), children.end(), child);
        if (it != children.end()) {
            children.erase(it);  // Remove the child from the parent's children list
            cout << "Pruned child " << child->hash << " from parent " << parent->hash << endl;
        }
    }





    void printBlockchain() {
        cout << "\nBlockchain Structure:\n";
        // Print blocks at each level in a hierarchical structure
        for (auto &pair : levels) {  // Iterate over map entries
            for (const auto &block : pair.second) {
                // Only print blocks that don't have a parent, representing a new tree in the structure
                if (isRootBlock(block)) {
                    printBlockchainRecursive(block, 0);
                }
            }
        }
    }

    void printBlockchainRecursive(const shared_ptr<Block> &block, int depth) {
        for (int i = 0; i < depth; ++i) {
            cout << "    ";
        }
        cout << "└── Block " << block->blockNumber << ": " << block->hash 
             << " (prev: " << block->prevHash << ")\n";
        for (const auto &child : block->children) {
            printBlockchainRecursive(child, depth + 1);
        }
    }

    string giveBlockchainString() {
        string blockchainString;
        // Iterate over the confirmed blockchain and append each block's details to the string
        for (const auto& block : confirmedBlockchain) {
            blockchainString += block->prevHash + ":" + block->message + ":" + 
                                to_string(block->blockNumber) + ":" + block->hash + ",";
        }
        // Remove the last comma if any blocks were added
        if (!blockchainString.empty()) {
            blockchainString.pop_back();
        }
        return blockchainString;
    }

    bool isRootBlock(const shared_ptr<Block> &block) {
        // A root block has no parent in the blockchain (no other block has its hash as prevHash)
        for (const auto &pair : levels) {
            for (const auto &otherBlock : pair.second) {
                if (otherBlock->hash == block->prevHash) {
                    return false;
                }
            }
        }
        return true;
    }
};



// FOR BLOCKCHAIN
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


// MAIN FUNCTION TO EXECUTE WHOLE BLOCK TRANSACTIONS
void executeWholeBlockTransactions(string input);

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

Blockchain blockchain;
MerklePatriciaTree blockchainState;
void executeWholeBlockTransactions(string input) {
    // PARSE THE STRING
    // INPUT IS OF TYPE string input = "nonce1,[abcd:efgh:5:120:sign1,qwer:tyui:6:135:sign2,abcd:efgh:5:120:sign1,]";
    // GET THE NONCE
    size_t nonceStart = input.find(",") + 1;  // Find the first comma to get the nonce part
    size_t nonceEnd = input.find("[", nonceStart); // Find the opening bracket to get the end of nonce1
    string nonce = input.substr(0, nonceEnd-1);

    // Remove the "nonce1," part and the brackets to work with the list of data
    string data = input.substr(nonceEnd + 1, input.size() - nonceEnd - 2); // Remove trailing ']'

    // Regular expression pattern to match the required components
    regex pattern("([a-zA-Z0-9]+):([a-zA-Z0-9]+):(\\d+):(\\d+):([a-zA-Z0-9]+)");

    // Use regular expression to find matches in the data part
    auto words_begin = sregex_iterator(data.begin(), data.end(), pattern);
    auto words_end = sregex_iterator();

    // Loop through all matches
    for (sregex_iterator i = words_begin; i != words_end; ++i) {
        smatch match = *i;
        
        // Extracting values from the regular expression match
        string senderPublicKey = match[1];
        string recieverPublicKey = match[2];
        int senderNonce = stoi(match[3]);
        int amount = stoi(match[4]);
        string sign = match[5];

        // Call the function fxn with the extracted values
        cout << "handlin txn = " << senderPublicKey<<recieverPublicKey<<senderNonce<<amount;
        blockchainState.handleTransaction(senderPublicKey, recieverPublicKey, senderNonce, amount);
    }
}

// MAIN FUNCTION TO HANDLE REQUESTS
string processCommand(const string& command, MerklePatriciaTree& blockchainState, Blockchain& blockchain) {

    if (command.rfind("GET_BY_ADDRESS", 0) == 0) {
        string publickKey = command.substr(15);
        Value* data = blockchainState.get(publickKey);
        if (data != nullptr) {
            cout << data->amount << data->nonce << endl;
            return (to_string(data->amount) + ":" + to_string(data->nonce));
        }
    } 

    else if (command.rfind("GET_ALL", 0) == 0){
        map<string, pair<int, int>> allData = blockchainState.getAllData();
        string data = "";
        for (const auto& entry : allData) {
            data += entry.first + ":" + to_string(entry.second.first) + ":" + to_string(entry.second.second) + ",";
        }
        return data;
    }

    else if (command.rfind("GET_BLOCKCHAIN", 0) == 0){
        string data = blockchain.giveBlockchainString();
        return data;
    }

    else if (command.rfind("ADD_BLOCK", 0) == 0) {
        istringstream iss(command);
        string commandType;
        string prevHash;
        string message;
        int blockNumber;
        string blockHash;

        iss >> commandType;

        iss >> prevHash >> message >> blockNumber >> blockHash;

        auto newBlock = make_shared<Block>(prevHash, message, blockNumber, blockHash);
        blockchain.addBlock(newBlock);

        return "1";
    }

    else if (command.rfind("GET_LAST_HASH", 0) == 0){
        string res = blockchain.getLastHash();
        return res;
    }

    else if (command.rfind("GET_LAST_LENGTH", 0) == 0){
        string len = blockchain.getLastLength();
        return len;
    }
    
    else if (command.rfind("GET_CONFIRMED_LENGTH", 0) == 0){
        return to_string(blockchain.confirmedLength);
    }


    return "UNKNOWN COMMAND\n";
}


// //Testing
int main() {
    blockchainState.insert("02a0a8ebb0c0eee0d31626cab16f7b5c82e6a93bc58767708310bfe8649f002a7a", 0, 0);       //MAIN ACCOUNT WITH 0 COINS


    // FOR SPEED ANALYSIS

    // auto start = high_resolution_clock::now();
    // for(int i = 1; i< 1000000; i++){
    //     blockchainState.handleTransaction("abcd", "efgh", i, 10);
    // }
    // auto stop = high_resolution_clock::now();
    // auto duration = duration_cast<microseconds>(stop - start);
    // cout << "Time taken by function: "
    // << duration.count()/1000 << " microseconds" << endl;

    


    // FOR CONNECTION TO JS
    // CPP SERVER

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
            string response = processCommand(string(buffer, bytesRead), blockchainState, blockchain);
            send(clientSocket, response.c_str(), response.size(), 0);
        }
        
        closesocket(clientSocket); // Close client connection after handling request
    }

    closesocket(serverSocket);
    WSACleanup();
    return 0;
}





// int main() {
    

//     while (true) {
//         string prevHash, message, hash;
//         int blockNumber;

//         cout << "\nEnter block details (prevHash message blockNumber hash): ";
//         cin >> prevHash >> message >> blockNumber >> hash;

//         auto newBlock = make_shared<Block>(prevHash, message, blockNumber, hash);
//         blockchain.addBlock(newBlock);
//         blockchain.printBlockchain();
//         cout << blockchain.giveBlockchainString() << endl;
//         cout << blockchain.getLastHash() << endl;
//         cout << blockchain.getLastLength() << endl;
//         cout << blockchain.confirmedLength;
//     }

//     return 0;
// }