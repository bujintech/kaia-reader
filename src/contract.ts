import { Contract } from "ethers";
import { JsonRpcProvider } from '@kaiachain/ethers-ext/v6'
import { BASE_NODE_RPC } from './configs';

export const provider = new JsonRpcProvider(BASE_NODE_RPC);

const ERC165Abi = [
    {
        inputs: [
            {
                internalType: "bytes4",
                name: "interfaceId",
                type: "bytes4",
            },
        ],
        name: "supportsInterface",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
];

export async function isKip37(contractAddress: string) {
    try {
        const contract = new Contract(contractAddress, ERC165Abi, provider);
        const result = await contract.supportsInterface("0x6433ca1f");
        return result;
    } catch (err) {
        return false;
    }
}

export async function isErc1155(contractAddress: string) {
    try {
        const contract = new Contract(contractAddress, ERC165Abi, provider);
        const result = await contract.supportsInterface("0xd9b67a26");
        return result;
    } catch (err) {
        return false;
    }
}

export async function isErc721(contractAddress: string) {
    try {
        const contract = new Contract(contractAddress, ERC165Abi, provider);
        const result = await contract.supportsInterface("0x80ac58cd");
        return result;
    } catch (err) {
        return false;
    }
}

module.exports = {
    isErc1155,
    isErc721,
    isKip37
}
