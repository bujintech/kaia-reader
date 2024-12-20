import { BASE_NODE_RPC } from "../configs";
import { TransferTopics, ERC20_LOG_TRANSFER, TokenType } from "../specifications";
import { getBlockTimestamp, getTokenType } from "../utils/token";
import { compressData, writeBatch } from "../utils/db";
import chalk from "chalk";
import { saveTokenInfo } from "./token-sync";
import { parseBigInt } from "../utils/number-utils";
import { chunk, trimStart } from "lodash";
import { parseLogData } from "../utils/transaction-utils";

export enum TransferType {
    Transfer = "Transfer",
    TransferSingle = "TransferSingle",
    TransferBatch = "TransferBatch",
}

export interface TokenTransferLog {
    paramIndex: number;
    blockNumber: number;
    txIndex: number;
    logIndex: number;
    txHash: string;
    tokenType: TokenType;
    contractAddress: string;
    from: string;
    to: string;
    amount?: bigint;
    topic: TransferTopics;
    transferType: TransferType;
    tokenId?: bigint;
    timestamp: number;
    tokenName?: string;
}

interface RawLog {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
}

function getTransferType(topic: string): TransferType {
    switch (topic) {
        case ERC20_LOG_TRANSFER:
            return TransferType.Transfer;
        case TransferTopics.TransferSingle:
            return TransferType.TransferSingle;
        case TransferTopics.TransferBatch:
            return TransferType.TransferBatch;
        default:
            throw new Error(`Unsupported topic: ${topic}`);
    }
}

async function parseTransferBatchData(logData: string): Promise<{
    paramIndex: number,
    tokenId: bigint,
    amount: bigint
}[]> {
    const data = logData.substring(2); // Remove 0x
    const dataNumbers: number[] = [];
    const bigInts: bigint[] = [];
    let tokenAmount = 0;
    for (let i = 0; i < data.length; i += 64) {
        const numberStr = `0x${data.substring(i, i + 64)}`;
        if (i === 2) {
            tokenAmount = parseInt(numberStr, 16);
        }

        const nextNumber = parseInt(numberStr);
        if (nextNumber === Infinity) {
            console.log(data.substring(i, i + 64));
        }
        dataNumbers.push(nextNumber);
        bigInts.push(parseBigInt(numberStr)); // Add 0x prefix for each number
    }

    const tokenIds = bigInts.slice(3, 3 + tokenAmount);
    const amounts = bigInts.slice(3 + tokenAmount + 1, bigInts.length);
    return tokenIds.map((tokenId, index) => ({
        paramIndex: index,
        tokenId,
        amount: BigInt(amounts[index])
    }));
}

async function getTransferLogs(fromBlockNumber: number, {
    tokenType,
    logDetail
}: {
    tokenType?: TokenType[],
    logDetail?: boolean
}): Promise<TokenTransferLog[]> {
    if (!BASE_NODE_RPC) {
        throw new Error("BASE_NODE_RPC is not set");
    }

    const _tokenType = tokenType ?? [TokenType.ERC20, TokenType.ERC721, TokenType.ERC1155, TokenType.KIP37];
    const transferLogTopics = _tokenType.map(type => {
        switch (type) {
            case TokenType.ERC20:
                return ERC20_LOG_TRANSFER;
            case TokenType.ERC721:
                return TransferTopics.Transfer;
            case TokenType.ERC1155:
                return [TransferTopics.TransferSingle, TransferTopics.TransferBatch];
            case TokenType.KIP37:
                return [TransferTopics.TransferSingle, TransferTopics.TransferBatch];
            default:
                throw new Error(`Unsupported token type: ${type}`);
        }
    }).flat();

    const rawLogs: RawLog[] = [];

    while (true) {
        const res = await fetch(BASE_NODE_RPC, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                method: "eth_getLogs",
                id: 1,
                jsonrpc: "2.0",
                params: [{
                    fromBlock: fromBlockNumber,
                    toBlock: fromBlockNumber,
                    topics: [transferLogTopics]
                }]
            })
        });
        const data = await res.json() as { result?: RawLog[], error?: any };
        if (data.result) {
            rawLogs.push(...(data.result || []));
            break;
        } else if (data.error.code !== -32000) {
            console.error(chalk.redBright("RPC Error: "), data.error);
        } else {
            console.error(chalk.redBright("RPC Error: "), data.error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    let counterTransfer = 0;
    let counterTransferBatch = 0;
    let counterTransferSingle = 0;

    const resultData = await Promise.all(rawLogs.map(async log => {
        const blockNumber = parseInt(log.blockNumber);
        const timestamp = await getBlockTimestamp(blockNumber);
        const tokenType = await getTokenType(log.address);

        if (tokenType === TokenType.UNKNOWN) {
            console.log(chalk.redBright("Unknown token type: "), log.address);
        }
        const tokenInfo = await saveTokenInfo(log.address);
        let transfers: {
            paramIndex: number,
            from: string,
            to: string,
            tokenId?: bigint,
            amount: bigint,
            topic: TransferTopics,
            tokenName: string | undefined
        }[] = [];

        switch (log.topics[0]) {
            case TransferTopics.Transfer: {
                counterTransfer++;
                if (log.topics.length == 4) {
                    // event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
                    const [, from, to, tokenId] = log.topics;
                    transfers.push({
                        paramIndex: 0,
                        from,
                        to,
                        amount: 1n,
                        topic: TransferTopics.Transfer,
                        tokenId: BigInt(tokenId),
                        tokenName: tokenInfo?.name
                    });
                } else if (log.topics.length === 3) {
                    // event Transfer(address indexed _from, address indexed _to, uint256 _value)
                    const [, from, to] = log.topics;
                    const amount = log.data === '0x' ? 1n : parseBigInt(log.data);
                    transfers.push({
                        paramIndex: 0,
                        from,
                        to,
                        amount,
                        topic: TransferTopics.Transfer,
                        tokenName: tokenInfo?.name
                    });
                } else if (log.topics.length === 1) {
                    const [from, to, amountStr] = parseLogData(log.data);
                    transfers.push({
                        paramIndex: 0,
                        from: `0x${from}`,
                        to: `0x${to}`,
                        amount: parseBigInt(amountStr),
                        topic: TransferTopics.Transfer,
                        tokenName: tokenInfo?.name
                    })
                }
                break;
            }
            case TransferTopics.TransferSingle: {
                counterTransferSingle++;
                const [, , from, to] = log.topics;
                const tokenId = parseBigInt(log.data.substring(2, 66));
                const amount = parseBigInt(log.data.substring(66));
                transfers.push({
                    paramIndex: 0,
                    tokenId,
                    amount,
                    from,
                    to,
                    topic: TransferTopics.TransferSingle,
                    tokenName: tokenInfo?.name
                });
                break;
            }
            case TransferTopics.TransferBatch: {
                counterTransferBatch++;
                const [, , from, to] = log.topics;
                const batchData = await parseTransferBatchData(log.data);
                transfers.push(...batchData.map(x => ({
                    ...x,
                    from,
                    to,
                    topic: TransferTopics.TransferBatch,
                    tokenName: tokenInfo?.name
                })));
                break;
            }
            default:
                throw new Error("[Unreachable] Unsupported topic");
        }

        // const contractAddress = log.address;

        return transfers.map((x): TokenTransferLog => ({
            blockNumber: parseInt(log.blockNumber),
            txIndex: parseInt(log.transactionIndex),
            logIndex: parseInt(log.logIndex, 16),
            txHash: log.transactionHash,
            tokenType,
            contractAddress: log.address,
            transferType: getTransferType(log.topics[0]),
            timestamp,
            ...x,
        }))
    }))

    const flatenData = resultData.flat();
    console.log(chalk.cyanBright("Total transfer logs:"), flatenData.length);

    const transferLogs = flatenData.filter(x => x.transferType === TransferType.Transfer);
    if (transferLogs.length > 0) {
        console.log(chalk.cyanBright("Transfer logs:"), transferLogs.length);
        if (logDetail) {
            transferLogs.forEach(logTransfer);
        }
    }

    const transferBatchLogs = flatenData.filter(x => x.transferType === TransferType.TransferBatch);
    if (transferBatchLogs.length > 0) {
        console.log(chalk.cyanBright("TransferBatch logs:"), transferBatchLogs.length);
        if (logDetail) {
            transferBatchLogs.forEach(logTransfer);
        }
    }

    const transferSingleLogs = flatenData.filter(x => x.transferType === TransferType.TransferSingle);
    if (transferSingleLogs.length > 0) {
        console.log(chalk.cyanBright("TransferSingle logs:"), transferSingleLogs.length);
        if (logDetail) {
            transferSingleLogs.forEach(logTransfer);
        }
    }

    return flatenData;
}

const logTransfer = (x: TokenTransferLog) => {
    console.log(` [${x.logIndex}]`, chalk.greenBright(x.txHash));
    console.log(" ", " ", chalk.gray(x.from), "=>", chalk.gray(x.to));
    console.log(" ", " ", "Contract:", chalk.gray(x.contractAddress));
    if (x.tokenId) {
        console.log(" ", " ", "Token ID:", chalk.gray(x.tokenId));
    }
    console.log(" ", " ", "Amount:", chalk.gray(x.amount));
}

async function saveTransferLogs(logs: TokenTransferLog[]) {
    const data = logs.map(x => {
        switch (x.tokenType) {
            case TokenType.ERC20: {
                const sk = `TRANSFER#TOKEN#${x.blockNumber}#${x.logIndex.toString().padStart(3, "0")}`;
                return {
                    PK: `${x.blockNumber}`,
                    SK: sk,
                    GS1PK: x.txHash,
                    GS1SK: `TRANSFER#TOKEN#${x.logIndex.toString().padStart(3, "0")}`,
                    GS2PK: "0x" + x.from.substring(x.from.length - 40, x.from.length),
                    GS2SK: sk,
                    GS3PK: "0x" + x.to.substring(x.from.length - 40, x.from.length),
                    GS3SK: sk,
                    GS4PK: x.contractAddress,
                    GS4SK: sk,
                    RESULT: compressData(x),
                    CHAIN: 'KAIA',
                    METHOD: TransferTopics[x.topic as unknown as keyof typeof TransferTopics],
                    TIMESTAMP: x.timestamp,
                    NAME: x.tokenName,
                    TYPE: x.tokenType,
                    AMOUNT: x.amount?.toLocaleString('fullwide', { useGrouping: false }),
                    TOKEN_ADDRESS: x.contractAddress,
                    NFTID: x.tokenId?.toLocaleString('fullwide', { useGrouping: false }),
                }
            }
            default: {
                const sk = `TRANSFER#NFT#${x.blockNumber}#${x.logIndex.toString().padStart(3, "0")}#${x.paramIndex.toString().padStart(3, "0")}`;
                return {
                    PK: `${x.blockNumber}`,
                    SK: sk,
                    GS1PK: x.txHash,
                    GS1SK: sk,
                    GS2PK: "0x" + x.from.substring(x.from.length - 40, x.from.length),
                    GS2SK: sk,
                    GS3PK: "0x" + x.to.substring(x.from.length - 40, x.from.length),
                    GS3SK: sk,
                    GS4PK: x.contractAddress,
                    GS4SK: sk,
                    RESULT: compressData(x),
                    CHAIN: 'KAIA',
                    METHOD: TransferTopics[x.topic as unknown as keyof typeof TransferTopics],
                    TIMESTAMP: x.timestamp,
                    NAME: x.tokenName,
                    TYPE: x.tokenType,
                    AMOUNT: x.amount?.toLocaleString('fullwide', { useGrouping: false }),
                    TOKEN_ADDRESS: x.contractAddress,
                    NFTID: x.tokenId?.toLocaleString('fullwide', { useGrouping: false }),
                }
            }
        }
    });

    try {
        await writeBatch(data);
    } catch (e) {
        console.error("Error in batchWrite", e, "data", data);
        throw e;
    }
}

let lastTimeDiff = Infinity;

export async function saveTransferLogsByNumber(blockNumber: number, options: { showLog?: boolean } = {}): Promise<{ slow: boolean }> {
    const startTime = Date.now();
    const logs = await getTransferLogs(blockNumber, { logDetail: options.showLog });
    const timeCost = Date.now() - startTime;
    console.log(chalk.blueBright("Read transfer logs... Time cost:"), chalk.yellowBright(timeCost), chalk.blueBright("ms"));
    try {
        if (logs.length === 0) {
            console.log(chalk.yellowBright(`No logs found for block number: ${blockNumber}, Skipping...`));
            return { slow: false };
        }

        const chunks = chunk(logs, 25);

        console.log("Writing transfer logs to DB, block:", [...new Set(logs.map(x => x.blockNumber))], "Total chunks:", chunks.length);
        const dbStartTime = Date.now();

        await Promise.all(chunks.map(async (chunk, index) => {
            const chunkStartTime = Date.now();
            await saveTransferLogs(chunk);
            const chunkTimeCost = Date.now() - chunkStartTime;
            console.log(chalk.green(`Finished chunk ${index + 1}/${chunks.length}... Time cost:`), chalk.yellowBright(chunkTimeCost), chalk.green("ms"));
        }));

        const dbTimeCost = Date.now() - dbStartTime;
        console.log(chalk.green("Finished saving all transfer logs... Total DB time cost:"), chalk.yellowBright(dbTimeCost), chalk.green("ms"));

        console.log(`Saved ${logs.length} transfer logs for block number: ${blockNumber}`);
        console.log("Block time:", chalk.magentaBright(logs[0] && new Date(logs[0].timestamp * 1000).toLocaleString("zh-CN")));
        console.log("Log time:", chalk.magentaBright(new Date().toLocaleString("zh-CN")));
        const timeDiff = (new Date().getTime() - logs[0].timestamp * 1000) / 1000;
        const slow = timeDiff > lastTimeDiff;
        console.log("Time diff to latest block:", timeDiff < lastTimeDiff ? chalk.greenBright(timeDiff) : chalk.redBright(timeDiff), "s");
        lastTimeDiff = timeDiff;
        return { slow }
    } catch (e) {
        throw e;
    }
}
