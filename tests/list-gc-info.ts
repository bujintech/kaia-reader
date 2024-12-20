import { getGcInfo, saveGcInfo } from "../src/sync-runner/gc-sync";

(async () => {
    const gcInfo = await getGcInfo(172368001);
    console.log(JSON.stringify(gcInfo, null, 2));
    console.log(gcInfo.result.reduce((a, b) => a + b.totalStaking, 0));
    await saveGcInfo();
})();
