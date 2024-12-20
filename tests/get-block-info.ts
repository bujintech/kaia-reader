import { saveBlockByNumber } from "../src/sync-runner/block-tx-sync";
import { saveTransferLogsByNumber } from "../src/sync-runner/transfers-sync";
import { getBlockByNumber } from "../src/utils/rpc"

(async () => {
    const block = await saveBlockByNumber(172442987);
    await saveTransferLogsByNumber(172442987, { showLog: true });
    console.log(block);
})()
