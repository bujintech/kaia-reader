import chalk from "chalk";
import { compressData, docClient, TABLE_NAME } from "../utils/db";
import { PRICE_INTERVAL, CMC_API_KEY } from "../configs";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

let latestPriceTimestamp = 0;

export async function saveKaiaPrice() {
    const interval = PRICE_INTERVAL;
    if (Date.now() - latestPriceTimestamp < interval) {
        return;
    }

    while (true) {
        try {

            console.log(chalk.blueBright("Saving kaia price"));
            const url = "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=32880";

            const response = await fetch(url, {
                headers: {
                    "X-CMC_PRO_API_KEY": CMC_API_KEY
                }
            });

            const data = await response.json();

            console.log(data);
            const kaiaData = data.data["32880"];
            const price = kaiaData.quote.USD.price;
            const volume = kaiaData.quote.USD.volume_24h;
            const marketCap = kaiaData.quote.USD.market_cap;
            const circulatingSupply = kaiaData.circulating_supply;
            latestPriceTimestamp = Date.now();

            console.log(chalk.blueBright("Kaia price:"), price, volume, marketCap, circulatingSupply);
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    PK: 'KAIA_QUOTE',
                    SK: 'KAIA_QUOTE',
                    RESULT: compressData(kaiaData),
                    CHAIN: 'KAIA',
                    PRICE: Number(price).toFixed(6),
                    VOLUME: parseInt(volume),
                    MARKETCAP: parseInt(marketCap),
                    CIRCULATINGSUPPLY: parseInt(circulatingSupply),
                },
            });

            const startTime = Date.now();
            await docClient.send(command);
            const timeCost = Date.now() - startTime;
            console.log(chalk.blueBright("Setting kaia price... Time cost:"), chalk.yellowBright(timeCost), chalk.blueBright("ms"));
            break;
        } catch (e) {
            console.log(chalk.redBright("Error setting kaia price:"), e);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
