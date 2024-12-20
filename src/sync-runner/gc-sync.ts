import { BASE_NODE_RPC, GC_INFO_INTERVAL } from "../configs";
import { chunk } from "lodash";
import { compressData, writeBatch } from "../utils/db";
import { round } from "lodash";

const GcInfoNameMapping = {
    "0x0c41cce8ddaea235f97745a13207421dca7340fa": "Verichains/VNG",
    "0x99d783c17f3d7b23abea1da35b00566555226c71": "DWF Labs",
    "0x54e8bc489cee5ab638920cc80160d8095df846b1": "NEOPIN",
    "0x75239993ac422a4e6a7441d5ab47ed6e91faf306": "Kakao Corp",
    "0x368dd4c4d9eaadba63d03d46d763524ccf6ee4ed": "Dora",
    "0xf786c3720a10cb48c8f12d0ac2086dcf227c7cde": "Wemix",
    "0x004cc301b9d522d3c33d559ff0cdf8c9a2c8bf1b": "Ozys",
    "0x842ab31ab877b67a7636927580d83c5ee561c981": "Animoca Brands",
    "0x5ed9914689a2fafb55a0c99a1c10d2f911d37734": "NFTBank",
    "0xdad50dc58727c00969802530c3fb270557ce4451": "Maekyung Media Group",
    "0xdbd3fbdc9e1965855b773a4746f27165b787fe3c": "Kracker Labs",
    "0x999999999939ba65abb254339eec0b2a0dac80e9": "Swapscanner",
    "0x4bf83dffa5eebf1818b4ca434b484bd08e5a8cdb": "X2E All",
    "0xdc7dda990c08513962d5ae6dfb195b1f6879bfaf": "Sygnum",
    "0x77666ab4632a6048307dc5abce1fd4d6526b4984": "SoftBank Corp.",
    "0x2fd3ff6e4ead7430ea25bab5e5b2b073492b7e6e": "Kakao Pay",
    "0x40ac911c5f24102ebb6a3992ddd905c1a11d19ec": "CREDER-ITCEN",
    "0xbb121974208b9282e72cb0da7f48d8ae14dba954": "METABORA",
    "0x4b87df856044f2580ca62f44f6e15121d7ebcc91": "Maekyung Media Group",
    "0x24e593fb29731e54905025c230727dc28d229f77": "EBC - Hanwha Systems",
    "0x04185389ec237dba242888a5a28b5555d011a223": "Binance",
    "0xc8e7053dc17bce47d2317718734ef087be40a023": "Presto Labs",
    "0x6bdafad8d3ca9ca7dc314d1276702ec2ecfb1e23": "LINE Xenesis",
    "0x0bb09aab5276ae532e33caf69d00a624adbc3fdf": "Marblex",
    "0x1602dae3b4d71cf48f53e61485a9aba89b7f3e2f": "Kommune DAO",
    "0xeee451713f21826912c76577e68315819a97468c": "GoodGang Labs",
    "0x6789effd9ef711e40ba02c63990b3153290f2382": "Jump Crypto - Everstake",
    "0x186de0382923086f73367bab16af09aeda4e54bf": "Ground X",
    "0x2b2a7a1d29a203f60e0a964fc64231265a49cd97": "AhnLab Blockchain Company",
    "0x179679457f93094a4e7186abcb2089661e92fc22": "Netmarble",
    "0xb38772304a72dc0492d2b509042e8fef4babfe34": "Bughole",
    "0x5f1dbd747996d8d31e2ab0317be7ffffd155522a": "Kakao Entertainment",
    "0xe2bc8add843d76b7ec571de7a43d66a9f0a10cf5": "Kaia Labs",
    "0x085a1e2f74a0e410f56ade04ced37f3528c35b81": "FSN",
    "0xa21d46316afd769194b94b48004db4ae72b37887": "Stable Lab",
    "0x69a3bfae473d057a45b8780a7eb571aad24b7141": "Bisonai",
    "0x5c7c093bf6084679e5c7518f37fae92e14ad70c9": "ABGA",
    "0xe5e6c55801760e3d51cd18cd648dcf1b062837cb": "DELIGHT",
    "0x5089015830bdb2dd3be51cfaf20e7dbc659d4c05": "Cosmostation",
    "0xa5de37ccf4bb10cc3bb8f5f6155d45186f831dc2": "LINE NEXT Corp.",
    "0xa03a003866bd5dc674147b5bd83e9ace9c112039": "LINE NEXT Inc.",
    "0xca5005b16f669e0d22498d8058f7384ca0911594": "SEGA Singapore",
    "0x67a89c0da266abf9fa7b4637352ec78e65d2b1d0": "Ludwig Holdings",
    "0xc1890dcbf4cd63f11324bb4733936b2ee339b19a": "CertiK",
    "0x36ef109d3d64a1001774855cb0b8e12a14faea70": "Hashkey",
} as { [key: string]: string };

let lastGcInfoTimestamp = 0;

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

    const gcInfo = data.councilRewardAddrs.reduce((acc, curr, index) => ({
        totalStaking: acc.totalStaking + data.councilStakingAmounts[index],
        gcInfos: {
            ...acc.gcInfos,
            [curr]: {
                totalStaking: data.councilStakingAmounts[index] + (acc.gcInfos[curr]?.totalStaking || 0),
                delegates: [...(acc.gcInfos[curr]?.delegates || []), {
                    delegateAddr: data.councilStakingAddrs[index],
                    staking: data.councilStakingAmounts[index]
                }]
            }
        }
    }), {
        totalStaking: 0,
        gcInfos: {},
    } as {
        totalStaking: number,
        gcInfos: {
            [key: string]: {
                totalStaking: number,
                delegates: {
                    delegateAddr: string,
                    staking: number,
                }[]
            }
        }
    })
    const result = [];
    for (const key in gcInfo.gcInfos) {
        const value = gcInfo.gcInfos[key];
        result.push({
            rewardAddr: key,
            ratio: value.totalStaking / gcInfo.totalStaking,
            ...value
        });
    }
    return {
        totalStaking: result.reduce((a, b) => a + b.totalStaking, 0),
        result,
    };
}

export async function saveGcInfo(blockNumber: number | 'latest' = 'latest') {
    if (Date.now() - lastGcInfoTimestamp < GC_INFO_INTERVAL) {
        return;
    }
    lastGcInfoTimestamp = Date.now();

    const gcInfo = await getGcInfo(blockNumber);
    await Promise.all(chunk(gcInfo.result.map((item) => ({
        PK: `GCINFO`,
        SK: `${item.rewardAddr}`,
        NAME: GcInfoNameMapping[item.rewardAddr] || item.rewardAddr,
        RATIO: round(item.ratio * 100, 2),
        AMOUNT: item.totalStaking,
        RESULT: compressData(item.delegates),
    })), 25).map(async (items) => {
        console.log(`Saving gc info`, items);
        await writeBatch(items);
    }));
}
