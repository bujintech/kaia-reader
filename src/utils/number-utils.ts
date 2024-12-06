export function parseBigInt(hex: string): bigint {
    return BigInt(hex.startsWith("0x") ? hex : `0x${hex}`);
}