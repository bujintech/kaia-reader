import { Contract } from "ethers";
import { isErc1155, isErc721, isKip37, provider } from "../src/utils/contract";
import { Erc20Abi } from "../src/specifications";

const contractAddress = '0xa505ee303d5ab53afc392a06f08758fc83a07209';

(async () => {
    console.log("ERC721", await isErc721(contractAddress));
    console.log("kip17", await isKip37(contractAddress));
    console.log("ERC1155", await isErc1155(contractAddress));
    const contract = new Contract(contractAddress, Erc20Abi, provider);
    const [totalSupply, name, symbol, decimals] = await Promise.all([
        contract.totalSupply,
        contract.name,
        contract.symbol,
        contract.decimals
    ].map(async (method) => {
        try {
            return await method();
        } catch (err) {
            // console.log(`Calling ${method.name} failed`, err);
            return null;
        }
    }));
    console.log(`${contractAddress} totalSupply: ${totalSupply}, name: ${name}, symbol: ${symbol}, decimals: ${decimals}`);
})()
