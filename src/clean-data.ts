import { DeleteItemCommand, DeleteItemCommandInput, DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { ACCESS_KEY_ID, DB_REGION, SSECRET_ACCESS_KEY, TABLE_NAME } from "./utils/db";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

if (!TABLE_NAME || !DB_REGION || !ACCESS_KEY_ID || !SSECRET_ACCESS_KEY) {
    throw new Error("Missing environment variables");
}

const tableName = TABLE_NAME as string;
const partitionKeyName = "PK";
const sortKeyName = "SK";

const client = new DynamoDBClient({
    region: DB_REGION,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SSECRET_ACCESS_KEY,
    },
});

const docClient = DynamoDBDocumentClient.from(client);

// new Promise(async () => {
//     console.log(TABLE_NAME)
//     while (currentBlock > 0) {
//         console.log("Current block:", currentBlock);
//         const queryRequest = new QueryCommand({
//             TableName: TABLE_NAME,
//             KeyConditionExpression: 'PK = :PK',
//             ExpressionAttributeValues: {
//                 ":PK": { S: currentBlock.toString() }
//             },
//             ScanIndexForward: false
//         } as QueryCommandInput)
//         const res = await docClient.send(queryRequest);
//         console.log(res.Items?.map(item => item.SK.S));

//         await Promise.all(chunks(res.Items ?? [], 25).map(async (chunk: any[]) => {
//             const deleteRequests = chunk.map(item => {
//                 console.log(item.PK.S, item.SK.S)
//                 return {
//                     DeleteRequest: {
//                         Key: {
//                             'SK': item.PK,
//                             'PK': item.SK,
//                         }
//                     }
//                 }
//             })

//             const batchWriteParams = {
//                 RequestItems: {
//                     ['devEVM']: deleteRequests
//                 }
//             }
//             console.log("BatchWriteParams:", batchWriteParams);

//             const res = await docClient.send(new BatchWriteItemCommand(batchWriteParams));
//             console.log("Res:", res);
//         }))

//         currentBlock--;
//     }
// }).then(() => {
//     console.log("Done");
// })

// function chunks(inputArray: any[], perChunk: number) {
//     return inputArray.reduce((all, one, i) => {
//         const ch = Math.floor(i / perChunk);
//         all[ch] = [].concat((all[ch] || []), one);
//         return all
//     }, [])
// }

async function getSortKeyValues(partitionKeyValue: string) {
    console.log(`${tableName}-dynamodb -- Retrieving sortKeys with partitionKey: ${partitionKeyValue}`);
    const params = {
        TableName: tableName,
        ProjectionExpression: sortKeyName,
        KeyConditionExpression: `${partitionKeyName} = :value`,
        ExpressionAttributeValues: {
            ':value': { S: partitionKeyValue }
        },
    };

    const command = new QueryCommand(params);
    const response = await client.send(command);

    const sortKeyValues = response.Items?.map((item) => item[sortKeyName].S);

    return sortKeyValues;
}

async function deleteRecords(fromBlockNumber: number) {
    let totalDeletedRecords = 0;

    for (let i = fromBlockNumber; i > 0; i--) {
        const partitionKeyValue = i.toString();

        const sortKeyValues = await getSortKeyValues(partitionKeyValue);

        for (const sortKeyValue of sortKeyValues ?? []) {

            const params = {
                TableName: tableName,
                Key: {
                    [partitionKeyName]: { S: partitionKeyValue },
                    [sortKeyName]: { S: sortKeyValue }
                },
            } as DeleteItemCommandInput;

            const command = new DeleteItemCommand(params);
            await client.send(command);

            totalDeletedRecords++;
            console.log(`${tableName}-dynamodb -- Deleted record with partitionKey: ${partitionKeyValue}, sortKey: ${sortKeyValue}`);
        }
    }

    console.log(`${tableName}-dynamodb -- Total deleted records: ${totalDeletedRecords}`);
    return totalDeletedRecords;
}

async function executeDynamoDBDeletionWithPartitionList() {
    let totalDeletedRecords = 0;
    try {
        totalDeletedRecords = await deleteRecords(168277577);
    } catch (error) {
        console.error(tableName + '-dynamodb -- An error occurred: ' + error);
    }

    return [{
        table: tableName,
        deletedRecords: totalDeletedRecords
    }];
}

executeDynamoDBDeletionWithPartitionList();
