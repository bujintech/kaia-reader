import chalk from "chalk";
import { Contract, JsonRpcProvider } from "ethers";
import { TokenType, Erc20Abi, Erc721Abi } from "../specifications";
import { isErc20, isKip37, isErc1155, isErc721 } from "./contract";
import { BASE_NODE_RPC } from '../configs';
import path from "path";
import fs from "fs";

const provider = new JsonRpcProvider(BASE_NODE_RPC);
const tokenTypeCache = new Map<string, Promise<TokenType>>();
export interface TokenInfo {
    contractAddress: string;
    timestamp: number;
    tokenType: TokenType;
    totalSupply?: bigint;
    name?: string;
    symbol?: string;
    decimals?: number;
}

export async function getBlockTimestamp(blockNumber: number) {
    const block = await provider.getBlock(blockNumber);
    return block?.timestamp ?? 0;
}

const tokenTypeGetter = async (contractAddress: string): Promise<TokenType> => {
    let tokenType = await isKip37(contractAddress) ? TokenType.KIP37 : // KIP37基于ERC1155
        await isErc1155(contractAddress) ? TokenType.ERC1155 :
            await isErc721(contractAddress) ? TokenType.ERC721 :
                await isErc20(contractAddress) ? TokenType.ERC20 :
                    TokenType.UNKNOWN;
    if (tokenType === TokenType.UNKNOWN) {
        let callingMethod = '';
        try {
            const contract = new Contract(contractAddress, Erc20Abi, provider);
            await Promise.all([
                contract.totalSupply(),
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.balanceOf("0x0000000000000000000000000000000000000000")
            ]);
            tokenType = TokenType.ERC20;
        } catch (err) {
            console.error(chalk.redBright("Error getting token type for"), chalk.yellowBright(contractAddress), chalk.blueBright('method:'), callingMethod);
            console.error(err);
            fs.appendFileSync(path.join(process.cwd(), 'logs', 'token-type-error.log'), `${contractAddress}\n${err}\n`);
            tokenType = TokenType.UNKNOWN;
        }
    }
    return tokenType;
}

export async function getTokenType(contractAddress: string): Promise<TokenType> {
    if (tokenTypeCache.has(contractAddress)) {
        return await tokenTypeCache.get(contractAddress)!!;
    }

    const getter = tokenTypeGetter(contractAddress);
    tokenTypeCache.set(contractAddress, getter);
    return getter;
}

export async function getTokenInfo(contractAddress: string): Promise<TokenInfo | null> {
    try {
        const tokenType = await getTokenType(contractAddress);
        // console.log(chalk.blueBright("Getting token info for"), chalk.yellowBright(contractAddress),
        //     chalk.blueBright('type:'), chalk.magenta(tokenType));
        if (tokenType === TokenType.ERC20) {
            const contract = new Contract(contractAddress, Erc20Abi, provider);
            const [totalSupply, name, symbol, decimals] = await Promise.all([
                contract.totalSupply(),
                contract.name(),
                contract.symbol(),
                contract.decimals(),
            ]);

            return {
                contractAddress,
                totalSupply,
                timestamp: Date.now(),
                tokenType,
                name,
                symbol,
                decimals,
            };
        } else if (tokenType === TokenType.ERC721) {
            const contract = new Contract(contractAddress, Erc721Abi, provider);
            let totalSupply = undefined;
            try {
                totalSupply = await contract.totalSupply();
            } catch (err) {
                console.error(chalk.redBright("Error getting totalSupply for ERC721"), chalk.yellowBright(contractAddress));
            }
            const [name, symbol] = await Promise.all([
                contract.name(),
                contract.symbol(),
            ]);
            return {
                contractAddress,
                timestamp: Date.now(),
                tokenType,
                totalSupply,
                name,
                symbol,
            };
        } else if (tokenType === TokenType.ERC1155 || tokenType === TokenType.KIP37) {
            // https://kips.kaia.io/KIPs/kip-37
            return {
                contractAddress,
                timestamp: Date.now(),
                tokenType,
            }
        }
        return null;
    } catch (error) {
        console.error(chalk.redBright("Error getting token info for"), chalk.yellowBright(contractAddress));
        console.error(error);
        throw error;
    }
}
