import { BASE_NODE_RPC } from "../configs";

export async function getLatestBlock() {
    const res = await fetch(BASE_NODE_RPC, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            id: 1
        })
    });
    const data = await res.json();
    return parseInt(data.result, 16);
}
