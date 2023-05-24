const Binance = require("binance-api-node").default;
const keypress = require("keypress");
require("dotenv").config();
const {
  long,
  short,
  repay,
  getID,
  profitBuy,
  profitSell,
  stopBuy,
  stopSell,
} = require("./crossManualOrders.js");
let longCheckInterval, shortCheckInterval;
let startTime = Date.now();

// Initialize the Binance client using your API key and secret
const client = Binance({
  apiKey: process.env.API,
  apiSecret: process.env.SECRET,
});

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on("keypress", (ch, key) => {
  if (key && key.name === "a") {
    initBuy();
  } else if (key && key.name === "s") {
    initLongProfit();
  } else if (key && key.name === "d") {
    initLongStop();
  } else if (key && key.name === "z") {
    initSell();
  } else if (key && key.name === "x") {
    initProfitShort();
  } else if (key && key.name === "c") {
    initStopShort();
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();

async function initBuy() {
  await buy();
}
async function initLongProfit() {
  await profitSell();
  longCheckInterval = setInterval(checkForLong, 1000 * 2);
}
async function initLongStop() {
  await stopSell();
  console.log(`Sell order filled !`);
  await repay("USDT");
  console.log("New trade is starting..");
  elapsedTime();
}
async function initSell() {
  await sell();
}
async function initProfitShort() {
  await profitBuy();
  shortCheckInterval = setInterval(checkForShort, 1000 * 2);
}
async function initStopShort() {
  await stopBuy();
  console.log(`Buy order filled !`);
  await repay("BTC");
  console.log("New trade is starting..");
  elapsedTime();
}

process.stdin.on("keypress", (ch, key) => {
  if (key.ctrl && key.name === "c") {
    process.exit();
  }
});

async function buy() {
  await long();
}

async function sell() {
  await short();
}

// checks if the order is filled
async function checkForLong() {
  let sellOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    orderId: getID().SellID,
  });
  if (sellOrder.status == "FILLED") {
    clearInterval(longCheckInterval);
    console.log(`Sell order filled !`);
    await repay("USDT");
    console.log("New trade is starting..");
  } else {
    console.log("Waiting for sell order to fill.......");
    elapsedTime();
  }
}

// checks if the order is filled
const checkForShort = async () => {
  let buyOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    orderId: getID().BuyID,
  });
  if (buyOrder.status == "FILLED") {
    clearInterval(shortCheckInterval);
    console.log(`Buy order filled !`);
    await repay("BTC");
    console.log("New trade is starting..");
  } else {
    console.log("Waiting for buy order to fill.......");
    elapsedTime();
  }
};

// time
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
