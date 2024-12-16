import chalk from "chalk";
import { setDbKaiaPrice } from "../utils/db";
import { PRICE_INTERVAL } from "../configs";

let latestPriceTimestamp = 0;

export async function saveKaiaPrice() {
    const interval = parseInt(PRICE_INTERVAL ?? "15000");
    if (Date.now() - latestPriceTimestamp < interval) {
        return;
    }

    const url = "https://api.coingecko.com/api/v3/simple/price?ids=kaia&vs_currencies=usd";

    const response = await fetch(url);

    const data = await response.json();

    console.log(data);
    const price = data.kaia.usd;
    latestPriceTimestamp = Date.now();

    console.log(chalk.blueBright("Kaia price:"), price);
    await setDbKaiaPrice(price);
}
