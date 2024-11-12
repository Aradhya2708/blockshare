#include <iostream>
#include <string>
#include <vector>
#include <map>
using namespace std;
//#include <openssl/sha.h>

string sha256(const string& data) {
    return "123";
}

//Structure to store vakue pair (amount, nonce)
struct Value {
    int amount;
    int nonce;

    Value(const int amt = 0, const int n = 0) : amount(amt), nonce(n) {}
};


//Base Node for all other nodes (Leaf, Branch etc)
class Node {
public:
    virtual ~Node() = default;
};

//Leaf Node (It will have value and the leftover string for user's public key)
class LeafNode : public Node {
public:
    string key;         //To store leftover public key
    Value value;        //To store amount, nonce

    LeafNode(const string& k, const Value& v) : key(k), value(v) {}
};

//Branch Node stores 16 childrens
class BranchNode : public Node {
public:
    Node* children[16]; //16 childrens based of 0 to F in public Key
    Value* value;      //Optional if it also acts as leaf node

    //Constructor to initialize value and children to null pointers
    BranchNode() : value(nullptr) {
        for (int i = 0; i < 16; i++) {
            children[i] = nullptr;
        }
    }

    //Cleaner (deletes both value and all childer to avoid MEMORY LEAK)
    ~BranchNode() {
        delete value;
        for (int i = 0; i < 16; ++i) {
            delete children[i];
        }
    }
};

// Extension node: stores a prefix and points to another node
class ExtensionNode : public Node {
public:
    string prefix;
    Node* next;
    Value* value;

    ExtensionNode(const string& p, Node* n, Value* v = nullptr) : prefix(p), next(n), value(v) {}

    ~ExtensionNode() {
        delete next;
        delete value;
    }
};




//THE MAIN MPT CLASS
class MerklePatriciaTree {
private:
    Node* root;


    //SOME HELPING FUNCTIONS

    // Helper:: Convert a character to its hexadecimal equivalent index
    // To use this index in string array
    int hexToIndex(char c) {
        if (c >= '0' && c <= '9') return c - '0';
        else if (c >= 'a' && c <= 'f') return c - 'a' + 10;
        return -1;
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


    // MAIN FUNCTIONS

    // Insert or Update Value
    Node* update(Node* node, const string& key, const Value& value, int depth) {
        if (!node) {
            return new LeafNode(key.substr(depth), value);
        }

        if (auto branch = dynamic_cast<BranchNode*>(node)) {
            int charIndex = hexToIndex(key[depth]);
            branch->children[charIndex] = update(branch->children[charIndex], key, value, depth + 1);
            return branch;
        }

        if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            string existingKey = leaf->key;
            string newKey = key.substr(depth);

            if (existingKey == newKey) {
                leaf->value = value;
                return leaf;
            }

            string commonPrefix = longestCommonPrefix(existingKey, newKey);

            if (commonPrefix.empty()) {
                BranchNode* branch = new BranchNode();
                int oldIndex = hexToIndex(existingKey[0]);
                int newIndex = hexToIndex(newKey[0]);

                branch->children[oldIndex] = leaf;
                branch->children[newIndex] = new LeafNode(newKey.substr(1), value);

                return branch;
            } else {
                ExtensionNode* extNode = new ExtensionNode(commonPrefix, nullptr);

                string remainingOld = existingKey.substr(commonPrefix.size());
                string remainingNew = newKey.substr(commonPrefix.size());

                if (remainingOld.empty()) {
                    // The existing key is fully consumed, store its value in the Extension Node
                    extNode->value = new Value(leaf->value);
                    if (remainingNew.empty()) {
                        // Both keys are fully consumed, update the value
                        *(extNode->value) = value;
                        delete leaf;
                        return extNode;
                    }
                    // Only new key has remaining part
                    extNode->next = new LeafNode(remainingNew, value);
                } else if (remainingNew.empty()) {
                    // Only old key has remaining part, new key is fully consumed
                    extNode->value = new Value(value);
                    extNode->next = leaf;
                    leaf->key = remainingOld;
                } else {
                    // Both keys have remaining parts
                    BranchNode* branch = new BranchNode();
                    int oldIndex = hexToIndex(remainingOld[0]);
                    int newIndex = hexToIndex(remainingNew[0]);

                    branch->children[oldIndex] = leaf;
                    leaf->key = remainingOld.substr(1);

                    branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);

                    extNode->next = branch;
                }

                return extNode;
            }
        }

        if (auto extNode = dynamic_cast<ExtensionNode*>(node)) {
            string commonPrefix = longestCommonPrefix(extNode->prefix, key.substr(depth));

            if (commonPrefix == extNode->prefix) {
                if (key.substr(depth + commonPrefix.size()).empty()) {
                    // Key is fully consumed, update or set the value in the Extension Node
                    if (extNode->value) {
                        *(extNode->value) = value;
                    } else {
                        extNode->value = new Value(value);
                    }
                } else {
                    // Continue traversing
                    extNode->next = update(extNode->next, key, value, depth + extNode->prefix.size());
                }
                return extNode;
            } else {
                // Split the extension node
                ExtensionNode* newExtNode = new ExtensionNode(commonPrefix, nullptr);

                string remainingOld = removePrefix(extNode->prefix, commonPrefix);
                string remainingNew = removePrefix(key.substr(depth), commonPrefix);

                if (remainingOld.empty()) {
                    // Old prefix is fully consumed
                    newExtNode->value = extNode->value;
                    extNode->value = nullptr;
                    if (remainingNew.empty()) {
                        // Both old and new are fully consumed, update the value
                        if (newExtNode->value) {
                            *(newExtNode->value) = value;
                        } else {
                            newExtNode->value = new Value(value);
                        }
                        newExtNode->next = extNode->next;
                        extNode->next = nullptr;
                        delete extNode;
                    } else {
                        // Only new key has remaining part
                        BranchNode* branch = new BranchNode();
                        int newIndex = hexToIndex(remainingNew[0]);
                        branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);
                        newExtNode->next = branch;
                    }
                } else if (remainingNew.empty()) {
                    // New key is fully consumed, old prefix has remaining part
                    newExtNode->value = new Value(value);
                    newExtNode->next = extNode;
                    extNode->prefix = remainingOld;
                } else {
                    // Both old and new have remaining parts
                    BranchNode* branch = new BranchNode();
                    int oldIndex = hexToIndex(remainingOld[0]);
                    int newIndex = hexToIndex(remainingNew[0]);

                    extNode->prefix = remainingOld.substr(1);
                    branch->children[oldIndex] = extNode;
                    branch->children[newIndex] = new LeafNode(remainingNew.substr(1), value);

                    newExtNode->next = branch;
                }

                return newExtNode;
            }
        }

        return nullptr;
    }


    // Helper:: Get value { amount, nonce } for a public key
    Value* get(Node* node, const string& key, int depth) {
        
        if (!node) return nullptr;

        // If Node is a Leaf Node
        if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            if (leaf->key == key.substr(depth)) {
                return &leaf->value;
            }
        }

        // If Node is a Branch Node
        else if (auto branch = dynamic_cast<BranchNode*>(node)) {
            // Get Index of Current Depth Char and Proceed Forward Recursively
            int index = hexToIndex(key[depth]);
            return get(branch->children[index], key, depth + 1);
        } 
        
        // If Node is a Ext. Node
        else if (auto extNode = dynamic_cast<ExtensionNode*>(node)) {
            string remainingKey = key.substr(depth);

            // Check if the extension Node prefix Completely Matches // Else Not Found
            if (remainingKey.substr(0, extNode->prefix.size()) == extNode->prefix) {
                return get(extNode->next, key, depth + extNode->prefix.size());
            }
        }

        return nullptr;     // Not Found
    }

    void getAllData(Node* node, map<string, Value>& data, const string& path) {

        if (!node) return;

        // Leaf Node
        if (auto leaf = dynamic_cast<LeafNode*>(node)) {
            // Store leaf data
            data[path + leaf->key] = leaf->value;
        }

        // Branch Node
        else if (auto branch = dynamic_cast<BranchNode*>(node)) {
            // If Branch itself is a leaf add its value
            if (branch->value) {
                data[path] = *branch->value;
            }
            for (int i = 0; i < 16; ++i) {
                if (branch->children[i]) {
                    getAllData(branch->children[i], data, path + to_string(i));
                }
            }
        }

        // Extension Node
        else if (auto extNode = dynamic_cast<ExtensionNode*>(node)) {
            // Simply add prefix to path and go Next
            getAllData(extNode->next, data, path + extNode->prefix);
        }
    }

    // Dev Helper:: Visualize the tree // No commenting required
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

    char indexToHexChar(int index) {
        return (index < 10) ? ('0' + index) : ('a' + index - 10);
    }

public:

    // Constructor With Root: NULL
    MerklePatriciaTree() : root(nullptr) {}

    // Insert or update a value
    int update(const string& key, int amount, int nonce) {
        Value v = {amount, nonce};
        root = update(root, key, v, 0);
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
    map<string, Value> getAllData() {
        map<string, Value> data;
        getAllData(root, data, "");
        return data;
    }
    
    // Visualize the tree
    void visualizeTree() {
        visualize(root);
    }
};




//Testing
int main() {
    MerklePatriciaTree mpt;

    mpt.update("abccdea7afa7052e2d1", 100, 1);
    mpt.update("deccdea7afa7052e2d1", 200, 1);
    mpt.update("deccdea8afa7052e2d1", 300, 1);
    mpt.update("deccdea9afa7052e2d1", 300, 1);
    mpt.update("deccdea4afa7052e2d1", 500, 1);
    mpt.update("abccdfg89erg8923r2f", 600, 1);
    mpt.visualizeTree();

    return 0;
}
