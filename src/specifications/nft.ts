// NFT 标准: KIP17(ERC-721), ERC-1155

/**
 * ```
 * event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
 * ```
 */
export const GENERIC_LOG_TRANSFER = '0xddf252ad';

/**
 * ```
 * event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
 * ```
 */
export const GENERIC_LOG_TRANSFER_FULL = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * ```
 * TransferSingle (address operator, address from, address to, uint256 id, uint256 value)
 * ```
 */
export const ERC1155_LOG_TRANSFER_SINGLE = '0xc3d58168';

/**
 * ```
 * TransferSingle (address operator, address from, address to, uint256 id, uint256 value)
 * ```
 */
export const ERC1155_LOG_TRANSFER_SINGLE_FULL = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';

/**
 * ```
 * TransferBatch (address operator, address from, address to, uint256[] ids, uint256[] values)
 * ```
 */
export const ERC1155_LOG_TRANSFER_BATCH = '0x4a39dc06';

/**
 * ```
 * TransferBatch (address operator, address from, address to, uint256[] ids, uint256[] values)
 * ```
 */
export const ERC1155_LOG_TRANSFER_BATCH_FULL = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';

export enum TransferTopics {
    /**
     * Exist in `ERC-721` and `KIP-17`, `tokenId` == `topics[3]`
     */
    Transfer = GENERIC_LOG_TRANSFER_FULL,
    TransferSingle = ERC1155_LOG_TRANSFER_SINGLE_FULL,
    TransferBatch = ERC1155_LOG_TRANSFER_BATCH_FULL,
}

export const Erc721Abi = [

    {
        inputs: [],
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
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
]

export const Erc1155Abi = [
    {
        name: "balanceOf",
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address"
            },
            {
                internalType: "uint256",
                name: "id",
                type: "uint256"
            }
        ],
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256"
            }
        ],
        stateMutability: "view",
        type: "function"
    },
]