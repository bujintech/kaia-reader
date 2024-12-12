export enum TokenType {
    ERC20 = "ERC20",
    KIP37 = "KIP37",
    ERC721 = "ERC721",
    ERC1155 = "ERC1155",
    UNKNOWN = "UNKNOWN",
}

/**
 * ```
 * Transfer (index_topic_1 address from, index_topic_2 address to, uint256 value)
 * ```
 */
export const ERC20_LOG_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const ERC20_METHOD_BALANCE_OF = '0x70a08231';
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
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function totalSupply() external view returns (uint256)",
]

export const Erc1155Abi = [
    "function balanceOf(address account, uint256 id) external view returns (uint256)"
]

export const Erc20Abi = [
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)",
    "function totalSupply() external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function allowance(address owner, address spender) external view returns (uint256)",
]