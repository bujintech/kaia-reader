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
        let syncInterval = 100;

        console.log(chalk.magentaBright("Start reading from block: "), currentBlock);

        while (true) {
            const startTime = Date.now();
            console.log(chalk.blueBright("Saving block: "), currentBlock);
            // Saving block and tx
            await saveBlockByNumber(currentBlock);
            // Saving transfer logs and tokens
            const { slow } = await saveTransferLogsByNumber(currentBlock, { showLog: false });
            // Update latest updated block number
            await setDbLastBlock(currentBlock);
            const timeCost = Date.now() - startTime;
            console.log(chalk.blueBright("Finished saving block "), currentBlock, "Time cost:", timeCost > 1000 ? chalk.redBright(timeCost) : chalk.greenBright(timeCost), "ms");
            console.log();
            currentBlock++;
            if (slow) {
                syncInterval -= Math.max(0, syncInterval - 50)
            } else {
                syncInterval += Math.min(1000, syncInterval + 50)
            }
            await new Promise(resolve => setTimeout(resolve, syncInterval));
        }
    })
