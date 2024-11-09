#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <unordered_map>
#include <algorithm>  // Include this for std::max_element and std::find

using namespace std;

int k = 2;
int m = 2;

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
    bool isGenesisAdded = false;

    Blockchain() {
        // Create and add the genesis block when the blockchain is initialized
        auto genesisBlock = make_shared<Block>("0", "a", 1, "1");
        addBlock(genesisBlock);
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
        confirmedBlockchain.push_back(block);        

        return true;
    }

    void resolveFork(shared_ptr<Block> block) {
        if (block->children.size() <= 1) {
            cout << "No fork detected. Block " << block->hash << " has " << block->children.size() << " children.\n";
            if(block->parent != nullptr)
                if(isConfirmed(block->parent))
                     return; // found confirmed blockchain
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

        if(isConfirmed(block->parent))
            return; // found confirmed blockchain

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

int main() {
    Blockchain blockchain;

    while (true) {
        string prevHash, message, hash;
        int blockNumber;

        cout << "\nEnter block details (prevHash message blockNumber hash): ";
        cin >> prevHash >> message >> blockNumber >> hash;

        auto newBlock = make_shared<Block>(prevHash, message, blockNumber, hash);
        blockchain.addBlock(newBlock);
        blockchain.printBlockchain();
    }

    return 0;
}
