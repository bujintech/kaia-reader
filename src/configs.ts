import { config } from 'dotenv';
config();

export const BASE_NODE_RPC = process.env.BASE_NODE_RPC;

export const START_BLOCK = process.env.START_BLOCK;

export default {
    BASE_NODE_RPC,
    START_BLOCK,
}