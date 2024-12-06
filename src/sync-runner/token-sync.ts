import path from "path";
import { writeSingle } from "../utils/db";
import { getTokenInfo } from "../utils/token";
import { TokenInfo } from "../utils/token";
import { createObjectCsvWriter } from "csv-writer";
import chalk from "chalk";

const csvWriter = createObjectCsvWriter({
    path: path.join(__dirname, 'token-info.csv'),
    alwaysQuote: true,
    header: [
        { id: 'contractAddress', title: 'Contract Address' },
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'tokenType', title: 'Token Type' },
        { id: 'totalSupply', title: 'Total Supply' },
        { id: 'name', title: 'Name' },
        { id: 'symbol', title: 'Symbol' },
        { id: 'decimals', title: 'Decimals' },
    ]
})

interface TokenInfoCache {
    cacheTime: number;
    tokenInfoPromise: Promise<TokenInfo | null>
}

const tokenInfoMap = new Map<string, TokenInfoCache>();

export async function saveTokenInfo(contractAddress: string): Promise<TokenInfo | null> {
    let tokenInfo: TokenInfo | null = null;
    let useCache = false;
    if (tokenInfoMap.has(contractAddress) && Date.now() - tokenInfoMap.get(contractAddress)!!.cacheTime < 3600000) {
        const cache = tokenInfoMap.get(contractAddress)!!;
        tokenInfo = await cache.tokenInfoPromise;
        // console.log(chalk.blueBright("Using cache for"), chalk.yellowBright(contractAddress), chalk.blueBright('type:'), chalk.magentaBright(tokenInfo.tokenType));
        useCache = true;
    } else {
        const tokenInfoPromise = getTokenInfo(contractAddress);
        tokenInfoMap.set(contractAddress, {
            cacheTime: Date.now(),
            tokenInfoPromise: tokenInfoPromise,
        });
        tokenInfo = await tokenInfoPromise;
    }
    if (!useCache && tokenInfo) {
        // csvWriter.writeRecords([tokenInfo]);
        console.log(chalk.blueBright("Saving token info: "), chalk.yellowBright(tokenInfo.contractAddress));
        await writeSingle({
            PK: tokenInfo.contractAddress,
            SK: `TOKEN#${tokenInfo.tokenType}#${tokenInfo.contractAddress}`,
            TIMESTAMP: tokenInfo.timestamp,
            NAME: tokenInfo.name,
            DECIMAL: tokenInfo.decimals,
            SYMBOL: tokenInfo.symbol,
        })
        console.log(chalk.greenBright("Finished saving token info of %s..."), contractAddress);
    }
    return tokenInfo;
}
