import { BASE_NODE_RPC } from "../configs";

export async function getGcInfo(blockNumber: number | "latest" = "latest") {
    const req = await fetch(BASE_NODE_RPC, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            method: "kaia_getStakingInfo",
            id: 1,
            jsonrpc: "2.0",
            params: [blockNumber]
        })
    })
    const data = (await req.json()).result as {
        councilNodeAddrs: string[]
        councilStakingAddrs: string[],
        councilRewardAddrs: string[],
        councilStakingAmounts: number[]
    };

    return data.councilRewardAddrs.reduce((acc, curr, index) => ({
        ...acc,
        [curr]: {
            totalStaking: data.councilStakingAmounts[index] + (acc[curr]?.totalStaking || 0),
            delegates: [...(acc[curr]?.delegates || []), {
                delegateAddr: data.councilStakingAddrs[index],
                staking: data.councilStakingAmounts[index]
            }]
        }
    }), {} as Record<string, {
        totalStaking: number,
        delegates: {
            delegateAddr: string,
            staking: number,
        }[]
    }>);
}
