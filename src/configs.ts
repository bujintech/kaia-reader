import { config } from 'dotenv';
config();

export const BASE_NODE_RPC = process.env.BASE_NODE_RPC;

export const START_BLOCK = parseInt(process.env.START_BLOCK ?? "0");

export const PRICE_INTERVAL = parseInt(process.env.PRICE_INTERVAL ?? "25000");

// 15 minutes
export const GC_INFO_INTERVAL = parseInt(process.env.GC_INFO_INTERVAL ?? (900000).toString());

export const CMC_API_KEY = process.env.CMC_API_KEY ?? "";

export default {
    BASE_NODE_RPC,
    START_BLOCK,
    PRICE_INTERVAL,
    CMC_API_KEY,
}
