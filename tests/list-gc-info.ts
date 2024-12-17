import { getGcInfo } from "../src/sync-runner/gc-sync";

(async () => {
    console.log(await getGcInfo());
})();
