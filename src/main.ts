import { saveTransferLogsByNumber } from './sync-runner/transfers-sync';
import { getDbLastBlock, setDbLastBlock } from './utils/db';
import { saveBlockByNumber } from './sync-runner/block-tx-sync';
import { getLatestBlock } from './utils/block';
import { START_BLOCK } from './configs';
import chalk from 'chalk';
import { saveKaiaPrice } from './sync-runner/miscellaneous-sync';

getLatestBlock()
    .then(async (n) => {
        console.log(chalk.magentaBright("Latest block: "), n);

        const startBlock = START_BLOCK ?? n;
        const dbLastBlock = await getDbLastBlock();

        let currentBlock = Math.max(startBlock, dbLastBlock + 1);

        console.log(chalk.magentaBright("Start reading from block: "), currentBlock);
        console.log(chalk.magentaBright("Price upadte time: "), currentBlock);

        while (true) {
            const startTime = Date.now();
            console.log(chalk.blue("Saving block:"), currentBlock);
            // Saving block and tx
            await saveBlockByNumber(currentBlock);
            // Saving transfer logs and tokens
            const { slow } = await saveTransferLogsByNumber(currentBlock, { showLog: false });
            // Update latest updated block number
            await setDbLastBlock(currentBlock);
            // Save kaia price
            await saveKaiaPrice();
            const timeCost = Date.now() - startTime;
            console.log(chalk.blueBright("Finished saving block"),
                currentBlock,
                chalk.blueBright("Time cost:"),
                timeCost > 1000 ? chalk.redBright(timeCost) : chalk.greenBright(timeCost),
                chalk.blueBright("ms"));
            console.log();
            currentBlock++;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    })
