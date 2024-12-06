import { Contract } from "ethers";
import { JsonRpcProvider } from '@kaiachain/ethers-ext/v6'
import { BASE_NODE_RPC } from '../configs';

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

export async function isErc20(contractAddress: string) {
    try {
        const res = await fetch(BASE_NODE_RPC, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getCode",
                params: [contractAddress, "latest"],
                id: 1
            })
        });

        if (!res.ok) {
            return false;
        }

        const data = await res.json();
        const bytecode = data.result;
        const signatures = [
            "0x70a08231", // balanceOf
            "0x18160ddd", // totalSupply
            "0xdd62ed3e", // allowance

            "0xa9059cbb", // transfer
            "0x23b872dd", // transferFrom
            "0x095ea7b3", // approve
        ];

        return signatures.every(sig => bytecode.includes(sig.slice(2)));
    } catch (error) {
        return false;
    }
}

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
