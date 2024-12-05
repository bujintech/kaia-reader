## RPC

```shell
curl -L 'https://192.168.1.3:8545/' -X POST \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
--data '{
  "method": "eth_getBlockByNumber",
  "id": 1,
  "jsonrpc": "2.0",
  "params": [
    "0xd0054e",
    true
  ]
}'
```

## Execution

```
pnpm run start
```

## Transfer Event Logs

### ERC20

```
event Transfer(address indexed _from, address indexed _to, uint256 _value)
```

### ERC721

```
event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
```

### KIP17

```
event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId);
```

### ERC1155

```
event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)
event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)
```

# Stored Token Data

## Table Schema

| Column Name  | Transaction                    | Token Transfer                              | NFT Transfer                                                | Token                                   |
| :----------: | :----------------------------- | :------------------------------------------ | :---------------------------------------------------------- | :-------------------------------------- |
|      PK      | `${blockNumber}`               | `${blockNumber}`                            | ~                                                           | `${contractAddress}`                    |
|      SK      | `TX#${blockNumber}#${txIndex}` | `TRANSFER#TOKEN#${blockNumber}#${logIndex}` | `TRANSFER#NFT#${blockNumber}#${logIndex}#{tokenParamIndex}` | `TOKEN#${tokenType}#${contractAddress}` |
|    GS1PK     | `${txHash}`                    | `${txHash}`                                 | ~                                                           |                                         |
|    GS1SK     | `TX`                           | `TRANSFER#TOKEN#${logIndex}`                | `TRANSFER#NFT#${blockNumber}#${logIndex}#{tokenParamIndex}` |                                         |
|    GS2PK     | `${fromAddress}`               | `${fromAddress}`                            | ~                                                           |                                         |
|    GS2SK     | `TX#${blockNumber}#${nonce}`   | `TRANSFER#TOKEN#${blockNumber}#${logIndex}` | `TRANSFER#NFT#${blockNumber}#${logIndex}#{tokenParamIndex}` |                                         |
|    GS3PK     | `${toAddress}`                 | `${toAddress}`                              | ~                                                           |                                         |
|    GS3SK     | `TX#${blockNumber}#${txIndex}` | `TRANSFER#TOKEN#${blockNumber}#${logIndex}` | `TRANSFER#NFT#${blockNumber}#${logIndex}#{tokenParamIndex}` |                                         |
|    GS4PK     |                                | `${contractAddress}`                        | ~                                                           |                                         |
|    GS4SK     |                                | `TRANSFER#TOKEN#${blockNumber}#${logIndex}` | `TRANSFER#NFT#${blockNumber}#${logIndex}#{tokenParamIndex}` |                                         |
|    RESULT    | `${RESULT}`                    | `${RESULT}`                                 | ~                                                           |                                         |
|    CHAIN     | `KAIA`                         | `KAIA`                                      | ~                                                           |                                         |
|    METHOD    |                                | `${method}`                                 | ~                                                           |                                         |
|  TIMESTAMP   | `${timestamp}`                 | `${timestamp}`                              | ~                                                           | `${timestamp}`                          |
|     NAME     |                                | `${tokenName}`                              | ~                                                           | `${name}`                               |
|     TYPE     |                                | `${tokenType}`                              | ~                                                           |                                         |
|    AMOUNT    |                                | `${amount}`                                 | ~                                                           |                                         |
| TOKENADDRESS |                                | `${tokenAddress}`                           | ~                                                           |                                         |
|    NFTID     |                                |                                             | `${nftId}`                                                  |                                         |
|   DECIMAL    |                                | `${decimals}`                               |                                                             | `${decimals} `                          |
