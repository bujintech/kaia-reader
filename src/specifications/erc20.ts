import { BASE_NODE_RPC } from "../configs";

export const ERC20_METHOD_BALANCE_OF = '0x70a08231';

/**
 * ```
 * Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)
 * ```
 */
export const ERC20_LOG_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

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

export const Erc20Abi = [
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        "inputs": [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        "inputs": [],
        name: "decimals",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
]
