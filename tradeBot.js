const indicators = require("./indicators.js");
const Binance = require("binance-api-node").default;
require("dotenv").config();
const {
  long,
  short,
  getCurrentPrice,
  repay,
  getOcoID,
  getPrices,
} = require("./tradeBotOrders.js");
let candle1, candle2, candle3;
let success = 0;
let failure = 0;
let profit = 0;
let startInterval, orderInterval, longCheckInterval, shortCheckInterval;
let startTime = Date.now();
const client = Binance({
  apiKey: process.env.API,
  apiSecret: process.env.SECRET,
});
const getCandleData = async () => {
  ({ candle1, candle2, candle3 } = await indicators());
};

// checking if the conditions are met to be able to place an order
const tryOrder = async () => {
  let currentPrice = await getCurrentPrice();
  await getCandleData();
  if (
    (currentPrice > candle3.ema &&
      candle1.macd < 0 &&
      candle2.macd > 0 &&
      candle2.macd * 3 < candle3.macd &&
      candle3.macd > 10 &&
      candle3.rsi > 80) ||
    (candle3.rsi < 15 && candle3.adx > 55) ||
    (candle3.rsi > 15 && candle3.rsi < 30 && candle3.adx > 60) ||
    (candle3.rsi < 25 && candle3.adx > 53 && candle3.macd < -5)
  ) {
    clearInterval(orderInterval);
    await long();
    longCheckInterval = setInterval(checkForLong, 1000 * 15);
  } else if (
    (currentPrice < candle3.ema &&
      candle1.macd > 0 &&
      candle2.macd < 0 &&
      candle2.macd * 3 > candle3.macd &&
      candle3.macd < -10 &&
      candle3.rsi < 10) ||
    (candle3.rsi > 85 && candle3.adx > 55) ||
    (candle3.rsi < 85 && candle3.rsi > 75 && candle3.adx > 65) ||
    (candle3.rsi > 75 && candle3.adx > 50 && candle3.macd > 20)
  ) {
    clearInterval(orderInterval);
    await short();
    shortCheckInterval = setInterval(checkForShort, 1000 * 15);
  } else {
    console.log(`Waiting to purchase`);
    elapsedTime();
  }
};

async function checkForLong() {
  let sellOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    orderId: getOcoID().ocoSellID,
  });
  if (sellOrder.status == "FILLED" || sellOrder.status == "EXPIRED") {
    clearInterval(longCheckInterval);
    if (sellOrder.status == "FILLED") {
      success++;
      profit +=
        (getPrices().boughtPrice - getPrices().sellPrice) *
        sellOrder.executedQty;
    } else {
      profit +=
        (getPrices().boughtPrice - getPrices().sellPrice) *
        sellOrder.executedQty;
      failure++;
    }
    console.log(`Sell order filled at ${sellOrder.price} !`);
    console.log(
      `Total profit: ${profit} and you have ${success} succesfull trades and ${failure} stops.`
    );
    await repay("USDT");
    console.log("New trade is starting..");
    setTimeout(() => {
      startInterval = setInterval(startTrade, 1000);
    }, 1000 * 60 * 2);
  } else {
    console.log("Waiting for sell order to fill.......");
    elapsedTime();
  }
}

const checkForShort = async () => {
  let buyOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    orderId: getOcoID().ocoBuyID,
  });
  if (buyOrder.status == "FILLED" || buyOrder.status == "EXPIRED") {
    clearInterval(shortCheckInterval);
    if (buyOrder.status == "FILLED") {
      success++;
      profit +=
        (getPrices().soldPrice - getPrices().buyPrice) * buyOrder.executedQty;
    } else {
      profit +=
        (getPrices().soldPrice - getPrices().buyPrice) * buyOrder.executedQty;
      failure++;
    }
    console.log(`Buy order filled at ${buyOrder.price} !`);
    console.log(
      `Total profit: ${profit} and you have ${success} succesfull trades and ${failure} stops.`
    );
    await repay("BTC");
    console.log("New trade is starting..");
    setTimeout(() => {
      startInterval = setInterval(startTrade, 1000);
    }, 1000 * 60 * 2);
  } else {
    console.log("Waiting for buy order to fill.......");
    elapsedTime();
  }
};

function elapsedTime() {
  let elapsed = Date.now() - startTime; // elapsed time in milliseconds
  let seconds = Math.floor(elapsed / 1000); // convert to seconds
  let minutes = Math.floor(seconds / 60); // convert to minutes
  let hours = Math.floor(minutes / 60); // convert to hours
  console.log(
    hours +
      " hours, " +
      (minutes % 60) +
      " minutes, and " +
      (seconds % 60) +
      " seconds elapsed"
  );
}
function startTrade() {
  var now = new Date();
  if (now.getSeconds() == 0) {
    tryOrder();
    orderInterval = setInterval(tryOrder, 1000 * 60);
    clearInterval(startInterval);
  }
}
startInterval = setInterval(startTrade, 1000);
