import { getBlockByNumber } from "../utils/rpc";
import { compressData, writeBatch } from "../utils/db";
import chalk from "chalk";

export async function getTransactions(blockNumber: number) {
    const blockData = await getBlockByNumber(blockNumber);
    console.log("Block Data: ", blockData);
    return blockData.transactions;
}

export async function saveBlockByNumber(blockNumber: number) {
    const blockData = await getBlockByNumber(blockNumber);

    const blockItem = {
        PK: `${blockData.blockNumber}`,
        SK: `BLOCK#${blockData.blockNumber}`,

        GS1PK: blockData.hash,
        GS1SK: `BLOCK`,

        GS2PK: blockData.miner,
        GS2SK: `BLOCK#${blockData.blockNumber}`,

        RESULT: compressData({
            ...blockData.raw,
            transactionsTotal: blockData.transactions.length
        }),
        TIMESTAMP: blockData.timestamp / 1000,
        TOTALTX: blockData.transactions.length,
        CHAIN: "KAIA",
    }

    const transactionItems = blockData.transactions.map(tx => ({
        PK: `${tx.blockNumber}`,
        SK: `TX#${tx.blockNumber}#${tx.txIndex.toString().padStart(3, "0")}`,

        GS1PK: tx.txHash,
        GS1SK: "TX",

        GS2PK: tx.from,
        GS2SK: `TX#${tx.blockNumber}#${tx.nonce}`,

        GS3PK: tx.to ?? '',
        GS3SK: `TX#${tx.blockNumber}#${tx.txIndex}`,

        RESULT: tx.raw,
        TIMESTAMP: blockData.timestamp / 1000,
        CHAIN: "KAIA",
    }));

    const fullData = [blockItem, ...transactionItems];

    const chunkSize = 25;
    let chunkIndex = 1;
    for (let i = 0; i < fullData.length; i += chunkSize) {
        const savingData = fullData.slice(i, i + chunkSize);
        try {
            await writeBatch(savingData);
        } catch (error) {
            console.log(chalk.redBright("Error writing block: "), blockNumber, "Chunk: ", chunkIndex);
            console.log(savingData);
            throw error;
        }
    }
}