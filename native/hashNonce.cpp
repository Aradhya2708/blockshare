#include <iostream>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>
#include <cstdlib>
#include <ctime>

using namespace std;

const unsigned int SHA256_K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
};

// Utility functions for SHA-256
unsigned int rotr(unsigned int x, unsigned int n) { return (x >> n) | (x << (32 - n)); }
unsigned int ch(unsigned int x, unsigned int y, unsigned int z) { return (x & y) ^ (~x & z); }
unsigned int maj(unsigned int x, unsigned int y, unsigned int z) { return (x & y) ^ (x & z) ^ (y & z); }
unsigned int bsig0(unsigned int x) { return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22); }
unsigned int bsig1(unsigned int x) { return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25); }
unsigned int ssig0(unsigned int x) { return rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3); }
unsigned int ssig1(unsigned int x) { return rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10); }

string sha256(const string &input) {
    unsigned int h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    unsigned int h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

    vector<unsigned char> data(input.begin(), input.end());
    data.push_back(0x80);

    while ((data.size() * 8) % 512 != 448) {
        data.push_back(0x00);
    }

    unsigned long long bit_len = input.size() * 8;
    for (int i = 7; i >= 0; --i) {
        data.push_back((bit_len >> (i * 8)) & 0xff);
    }

    for (size_t i = 0; i < data.size(); i += 64) {
        unsigned int w[64];
        for (int j = 0; j < 16; ++j) {
            w[j] = (data[i + j * 4] << 24) | (data[i + j * 4 + 1] << 16) | (data[i + j * 4 + 2] << 8) | (data[i + j * 4 + 3]);
        }

        for (int j = 16; j < 64; ++j) {
            w[j] = ssig1(w[j - 2]) + w[j - 7] + ssig0(w[j - 15]) + w[j - 16];
        }

        unsigned int a = h0, b = h1, c = h2, d = h3;
        unsigned int e = h4, f = h5, g = h6, h = h7;

        for (int j = 0; j < 64; ++j) {
            unsigned int temp1 = h + bsig1(e) + ch(e, f, g) + SHA256_K[j] + w[j];
            unsigned int temp2 = bsig0(a) + maj(a, b, c);
            h = g;
            g = f;
            f = e;
            e = d + temp1;
            d = c;
            c = b;
            b = a;
            a = temp1 + temp2;
        }

        h0 += a;
        h1 += b;
        h2 += c;
        h3 += d;
        h4 += e;
        h5 += f;
        h6 += g;
        h7 += h;
    }

    stringstream ss;
    ss << hex << setfill('0') << setw(8) << h0
       << setw(8) << h1 << setw(8) << h2 << setw(8) << h3
       << setw(8) << h4 << setw(8) << h5 << setw(8) << h6
       << setw(8) << h7;
    return ss.str();
}

string generateNonce() {
    const string chars = "0123456789";
    string nonce;
    for (int i = 0; i < 10; ++i) {
        nonce += chars[rand() % chars.length()];
    }
    return nonce;
}

bool hasLeadingZeros(const string &hash, int k) {
    for (int i = 0; i < k; ++i) {
        if (hash[i] != '0') return false;
    }
    return true;
}

pair<string, string> findNonceWithLeadingZeros(const string &input, int k) {
    srand(time(0));
    string nonce, resultHash;

    do {
        nonce = generateNonce();
        resultHash = sha256(input + nonce);
    } while (!hasLeadingZeros(resultHash, k));

    return { nonce, resultHash};
}

int main(int argc, char *argv[]) {
    if (argc != 3) {
        cerr << "Usage: " << argv[0] << " <baseString> <k>" << endl;
        return 1;
    }

    string baseString = argv[1];
    int k = stoi(argv[2]);

    auto out = findNonceWithLeadingZeros(baseString, k);

    // Output result in JSON format
    cout << "{\"result\": \"" << out.first << "\", \"hash\": \"" << out.second << "\"}" << endl;

    return 0;
}
