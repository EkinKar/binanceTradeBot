const Binance = require("binance-api-node").default;
const keypress = require("keypress");
require("dotenv").config();
const {
  long,
  short,
  repayUSDT,
  repayBTC,
  getOcoID,
  getPrices,
} = require("./isolatedOrder.js");
let failure = 0;
let profit = 0;
let longCheckInterval, shortCheckInterval;
var success = 0;
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
  // if the key is "a", trigger function1
  if (key && key.name === "a") {
    function1();
  }
  // if the key is "b", trigger function2
  else if (key && key.name === "s") {
    function2();
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();

async function function1() {
  await buy();
}

async function function2() {
  await sell();
}
process.stdin.on("keypress", (ch, key) => {
  if (key.ctrl && key.name === "c") {
    process.exit();
  }
});
const getCurrentPrice = async () => {
  const currentPriceObj = await client.prices({ symbol: "BTCUSDT" });
  return currentPriceObj.BTCUSDT.substring(0, 8);
};

async function buy() {
  await long();
  longCheckInterval = setInterval(checkForLong, 1000 * 5);
}

async function sell() {
  await short();
  shortCheckInterval = setInterval(checkForShort, 1000 * 5);
}

async function checkForLong() {
  let sellOrder = await client.marginGetOrder({
    symbol: "BTCUSDT",
    isIsolated: "TRUE",
    orderId: getOcoID().ocoSellID,
  });
  if (sellOrder.status == "FILLED" || sellOrder.status == "EXPIRED") {
    clearInterval(longCheckInterval);
    if (sellOrder.status == "FILLED") {
      success++;
      profit +=
        (getPrices().sellPrice - getPrices().boughtPrice) *
        sellOrder.executedQty;
    } else {
      profit +=
        (getPrices().sellPrice - getPrices().boughtPrice) *
        sellOrder.executedQty;
      failure++;
    }
    console.log(`Sell order filled at ${sellOrder.price} !`);
    console.log(
      `Total profit: ${profit} and you have ${success} succesfull trades and ${failure} stops.`
    );
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
