import { saveTransferLogsByNumber } from './sync-runner/transfers-sync';
import { getDbLastBlock, setDbLastBlock } from './utils/db';
import chalk from 'chalk';
import { saveBlockByNumber } from './sync-runner/block-tx-sync';
import { getLatestBlock } from './utils/block';
import { START_BLOCK } from './configs';

getLatestBlock()
    .then(async (n) => {
        console.log(chalk.magentaBright("Latest block: "), n);

        const startBlock = parseInt(START_BLOCK) ?? n;
        const dbLastBlock = await getDbLastBlock();

        let currentBlock = Math.max(startBlock, dbLastBlock + 1);

        console.log(chalk.magentaBright("Start reading from block: "), currentBlock);

        while (true) {
            console.log(chalk.blueBright("Saving block: "), currentBlock);
            // Saving block and tx
            await saveBlockByNumber(currentBlock);
            // Saving transfer logs and tokens
            await saveTransferLogsByNumber(currentBlock, { showLog: false });
            // Update latest updated block number
            await setDbLastBlock(currentBlock);
            console.log(chalk.blueBright("Finished saving block: "), currentBlock);
            console.log();
            currentBlock++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    })
