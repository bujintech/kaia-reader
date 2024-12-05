declare global {
    namespace NodeJS {
        interface ProcessEnv {
            START_BLOCK: string;
            BASE_NODE_RPC: string;
            [key: string]: string | undefined;
        }
    }
}

export {}; 