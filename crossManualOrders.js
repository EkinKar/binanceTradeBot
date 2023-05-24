const Binance = require("binance-api-node").default;
require("dotenv").config();
let soldPrice;
let boughtPrice;
let BuyID;
let SellID;
let buyPrice;
let sellPrice;
let BTCQuantity;
let USDTQuantity;
let sellStopPrice;
let buyStopPrice;

// Initialize the Binance client using your API key and secret
const client = Binance({
  apiKey: process.env.API,
  apiSecret: process.env.SECRET,
});

const long = async () => {
  await borrow("USDT");
  // Calculate the max buy amount
  const currentPrice = await getCurrentPrice();
  const accountInfo = await client.marginAccountInfo();
  USDTQuantity = String(
    parseFloat(
      accountInfo.userAssets
        .find((assets) => assets.asset == "USDT")
        .free.substring(0, 6)
    ) / parseFloat(currentPrice)
  ).substring(0, 6);

  // Place a buy order
  console.log("Placing buy order...");
  const response = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "MARKET",
    side: "BUY",
    quantity: USDTQuantity,
  });
  boughtPrice = response.fills[0].price;
  console.log(
    `Bought ${USDTQuantity}BTC at ${boughtPrice} for ${(
      USDTQuantity * boughtPrice
    ).toFixed(2)}$ !!!`
  );
};

const short = async () => {
  await borrow("BTC");
  // Calculate the max sell amount
  const accountInfo = await client.marginAccountInfo();
  BTCQuantity = accountInfo.userAssets
    .find((assets) => assets.asset == "BTC")
    .free.substring(0, 7);

  // Place a sell order
  console.log("Placing sell order...");
  const response = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "MARKET",
    side: "SELL",
    quantity: BTCQuantity,
  });
  soldPrice = response.fills[0].price;
  console.log(
    `Sold ${BTCQuantity}BTC at ${soldPrice} for ${(
      BTCQuantity * soldPrice
    ).toFixed(2)}$ !!!`
  );
};

const profitSell = async () => {
  sellPrice = (parseFloat(boughtPrice) * 1.001).toFixed(2);
  const sell = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "SELL",
    price: sellPrice,
    quantity: USDTQuantity,
  });
  SellID = sell.orderId;
};

const stopSell = async () => {
  sellPrice = (parseFloat(boughtPrice) * 0.9).toFixed(2);
  const sell = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "SELL",
    price: sellPrice,
    quantity: USDTQuantity,
  });
  SellID = sell.orderId;
};
const profitBuy = async () => {
  buyPrice = (parseFloat(soldPrice) * 0.999).toFixed(2);
  const buy = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "BUY",
    price: buyPrice,
    quantity: BTCQuantity,
  });
  BuyID = buy.orderId;
};
const stopBuy = async () => {
  buyPrice = (parseFloat(soldPrice) * 1.1).toFixed(2);
  const buy = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "BUY",
    price: buyPrice,
    quantity: BTCQuantity,
  });
  BuyID = buy.orderId;
};

const getID = function () {
  return { BuyID, SellID };
};

const getPrices = () => {
  return {
    boughtPrice,
    soldPrice,
    buyPrice,
    sellPrice,
    buyStopPrice,
    sellStopPrice,
  };
};
const borrow = async (asset) => {
  const max = await client.marginMaxBorrow({
    asset: asset,
  });
  const maxAmount = max.amount.substring(0, 7);
  await client.marginLoan({
    asset: asset,
    amount: maxAmount,
  });
  console.log(`Borrowed ${maxAmount} of ${asset} `);
};

const getCurrentPrice = async () => {
  const currentPriceObj = await client.prices({ symbol: "BTCUSDT" });
  return currentPriceObj.BTCUSDT.substring(0, 8);
};

const repay = async (coin) => {
  const marginAccountInfo = await client.marginAccountInfo();
  const findCoin = marginAccountInfo.userAssets.find(
    (asset) => asset.asset === coin
  );
  const borrowedAmount = String(
    parseFloat(findCoin.borrowed) + parseFloat(findCoin.interest)
  ).substring(0, 10);
  await client.marginRepay({ asset: coin, amount: borrowedAmount });
  console.log(`Paid all the borrowed ${coin} !!!`);
};

module.exports = {
  long,
  short,
  borrow,
  getCurrentPrice,
  repay,
  getID,
  getPrices,
  profitSell,
  stopSell,
  profitBuy,
  stopBuy,
};
