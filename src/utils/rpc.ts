import chalk from "chalk";
import { BASE_NODE_RPC } from "../configs";
import { gzipSync } from "zlib";
import { JsonRpcProvider } from "ethers";

export const provider = new JsonRpcProvider(BASE_NODE_RPC);

interface RawTransaction {
    from: string;
    to: string;
    transactionIndex: string;
    hash: string;
    nonce: string;
    type: string;
    blockNumber: string;
}

interface RawBlock {
    transactions: RawTransaction[];
    timestamp: string;
    number: string;
    hash: string;
    miner: string;
}

export interface Transaction {
    from: string;
    to: string;
    txHash: string;
    txIndex: number;
    nonce: number;
    type: string;
    raw: Buffer;
    blockNumber: number;
}

export interface Block {
    transactions: Transaction[];
    timestamp: number;
    blockNumber: number;
    hash: string;
    raw: Buffer;
    miner: string;
}

export async function getBlockByNumber(blockNumber: number): Promise<Block> {
    while (true) {
        try {
            const res = await fetch(BASE_NODE_RPC, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    method: "kaia_getBlockByNumber",
                    id: 1,
                    jsonrpc: "2.0",
                    params: [blockNumber, true]
                })
            });
            const data = await res.json();
            const { result, error } = data as { result?: RawBlock, error?: any };
            if (result) {
                const timestamp = parseInt(result.timestamp, 16) * 1000;

                const transactions: Transaction[] = await Promise.all(result.transactions.map(async (tx: RawTransaction) => ({
                    ...tx,
                    to: tx.to ?? await getToAddress(tx.hash),
                    txHash: tx.hash,
                    txIndex: parseInt(tx.transactionIndex, 16),
                    nonce: parseInt(tx.nonce, 16),
                    blockNumber: parseInt(tx.blockNumber, 16),
                    raw: gzipSync(Buffer.from(JSON.stringify(tx), "utf-8"))
                })));

                return {
                    ...result,
                    timestamp,
                    transactions,
                    blockNumber: parseInt(result.number, 16),
                    raw: gzipSync(Buffer.from(JSON.stringify(result)))
                };
            } else {
                throw new Error(error?.message || "Failed to get block");
            }
        } catch (error) {
            console.error(chalk.redBright("RPC Error: "), error);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
}

async function getToAddress(txHash: string) {
    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            throw new Error(`Receipt not found for txHash: ${txHash}`);
        }
        return receipt?.to ?? receipt?.contractAddress;
    } catch (error) {
        console.error(chalk.redBright("RPC Error: "), error);
        throw error;
    }
}