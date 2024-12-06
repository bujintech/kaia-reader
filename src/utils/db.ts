import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand, GetCommand, PutCommand, GetCommandInput, GetCommandOutput } from "@aws-sdk/lib-dynamodb";

const { TABLE_NAME, DB_REGION, ACCESS_KEY_ID, SSECRET_ACCESS_KEY } = process.env;

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
    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: 'MAX_BLOCK',
            SK: 'MAX_BLOCK',
            RESULT: blockNumber,
            CHAIN: 'KAIA',
        },
    });

    await docClient.send(command);
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