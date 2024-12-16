import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand, GetCommand, PutCommand, GetCommandInput, GetCommandOutput } from "@aws-sdk/lib-dynamodb";
import chalk from "chalk";
import { gzipSync } from "zlib";

export const { TABLE_NAME, DB_REGION, ACCESS_KEY_ID, SSECRET_ACCESS_KEY } = process.env;

if (!TABLE_NAME || !DB_REGION || !ACCESS_KEY_ID || !SSECRET_ACCESS_KEY) {
    throw new Error("Missing environment variables");
}

const client = new DynamoDBClient({
    region: DB_REGION,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SSECRET_ACCESS_KEY,
    },
});

const docClient = DynamoDBDocumentClient.from(client);

export async function writeSingle(data: any) {
    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: data,
    })

    await docClient.send(command);
}

export async function getItem(param: Omit<GetCommandInput, "TableName">): Promise<GetCommandOutput> {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        ...param,
    })
    return await docClient.send(command);
}

export async function writeBatch(data: any[]) {
    const command = new BatchWriteCommand({
        RequestItems: {
            [TABLE_NAME as string]: data.map(item => ({
                PutRequest: {
                    Item: item
                }
            })),
        },
    });

    await docClient.send(command);
}

export async function setDbLastBlock(blockNumber: number) {
    while (true) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: 'MAX_BLOCK',
                    SK: 'MAX_BLOCK',
                    RESULT: blockNumber,
                    CHAIN: 'KAIA',
                },
            });

            const startTime = Date.now();
            await docClient.send(command);
            const timeCost = Date.now() - startTime;
            console.log(chalk.blueBright("Setting db last block... Time cost:"), chalk.yellowBright(timeCost), chalk.blueBright("ms"));
            break;
        } catch (e) {
            console.log(chalk.redBright("Error setting db last block:"), e);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

export async function getDbLastBlock() {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: 'MAX_BLOCK',
            SK: 'MAX_BLOCK'
        },
    });

    return (await docClient.send(command)).Item?.RESULT;
}

export function compressData(data: any) {
    return gzipSync(JSON.stringify(data, (_, v) => typeof v === "bigint" ? v.toString() : v));
}

export async function setDbKaiaPrice(price: number) {
    while (true) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: 'KAIA_PRICE',
                    SK: 'KAIA_PRICE',
                    RESULT: price,
                    CHAIN: 'KAIA',
                },
            });

            const startTime = Date.now();
            await docClient.send(command);
            const timeCost = Date.now() - startTime;
            console.log(chalk.blueBright("Setting kaia price... Time cost:"), chalk.yellowBright(timeCost), chalk.blueBright("ms"));
            break;
        } catch (e) {
            console.log(chalk.redBright("Error setting kaia price:"), e);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
