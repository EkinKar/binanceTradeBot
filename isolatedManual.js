const Binance = require("binance-api-node").default;
const keypress = require("keypress");
require("dotenv").config();
const {
  long,
  short,
  repayUSDT,
  repayBTC,
  getID,
  profitBuy,
  profitSell,
  stopBuy,
  stopSell,
} = require("./isolatedManualOrders.js");
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
    initLong();
  } else if (key && key.name === "s") {
    initLongProfit();
  } else if (key && key.name === "d") {
    initLongStop();
  } else if (key && key.name === "z") {
    initShort();
  } else if (key && key.name === "x") {
    initShortProfit();
  } else if (key && key.name === "c") {
    initShortStop();
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();

async function initLong() {
  await buy();
}
async function initLongProfit() {
  await profitSell();
  longCheckInterval = setInterval(checkForLong, 1000 * 2);
}
async function initLongStop() {
  await stopSell();
  console.log(`Sell order filled !`);
  await repayUSDT();
  console.log("New trade is starting..");
  elapsedTime();
}
async function initShort() {
  await sell();
}
async function initShortProfit() {
  await profitBuy();
  shortCheckInterval = setInterval(checkForShort, 1000 * 2);
}
async function initShortStop() {
  await stopBuy();
  console.log(`Buy order filled !`);
  await repayBTC();
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

//checks if the order is filled or not
async function checkForLong() {
  let sellOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    isIsolated: "TRUE",
    orderId: getID().SellID,
  });
  if (sellOrder.status == "FILLED") {
    clearInterval(longCheckInterval);
    console.log(`Sell order filled !`);
    await repayUSDT();
    console.log("New trade is starting..");
  } else {
    console.log("Waiting for sell order to fill.......");
    elapsedTime();
  }
}

const checkForShort = async () => {
  let buyOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    isIsolated: "TRUE",
    orderId: getID().BuyID,
  });
  if (buyOrder.status == "FILLED") {
    clearInterval(shortCheckInterval);
    console.log(`Buy order filled !`);
    await repayBTC();
    console.log("New trade is starting..");
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
