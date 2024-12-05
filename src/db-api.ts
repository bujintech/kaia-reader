import { getItem } from "./utils/db";

export async function queryBlockByNumber(blockNumber: number) {
    const data = await getItem({
        Key: {
            PK: `${blockNumber}`,
            SK: `BLOCK#${blockNumber}`,
        },
    });
    console.log(data);
    return data;
}
