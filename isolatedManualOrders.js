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

const client = Binance({
  apiKey: process.env.API,
  apiSecret: process.env.SECRET,
});

const long = async () => {
  await borrow("USDT");
  // Calculate the max buy amount
  const currentPrice = await getCurrentPrice();
  const accountInfo = await client.marginIsolatedAccount({
    symbols: "BTCUSDT",
  });
  USDTQuantity = String(
    parseFloat(accountInfo.assets[0].quoteAsset.free.substring(0, 6)) /
      parseFloat(currentPrice)
  ).substring(0, 6);

  // Place a buy order
  console.log("Placing buy order...");
  const response = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "MARKET",
    side: "BUY",
    isIsolated: "TRUE",
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
  const accountInfo = await client.marginIsolatedAccount({
    symbols: "BTCUSDT",
  });
  BTCQuantity = accountInfo.assets[0].baseAsset.free.substring(0, 7);
  // Place a sell order
  console.log("Placing sell order...");
  const response = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "MARKET",
    side: "SELL",
    isIsolated: "TRUE",
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
  sellPrice = (parseFloat(boughtPrice) * 1.0004).toFixed(2);
  const sell = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "SELL",
    isIsolated: "TRUE",
    price: sellPrice,
    quantity: USDTQuantity,
  });
  SellID = sell.orderId;
};

const stopSell = async () => {
  sellPrice = (parseFloat(boughtPrice) * 0.99).toFixed(2);
  const sell = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "SELL",
    isIsolated: "TRUE",
    price: sellPrice,
    quantity: USDTQuantity,
  });
  SellID = sell.orderId;
};
const profitBuy = async () => {
  buyPrice = (parseFloat(soldPrice) * 0.9996).toFixed(2);
  const buy = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "BUY",
    isIsolated: "TRUE",
    price: buyPrice,
    quantity: BTCQuantity,
  });
  BuyID = buy.orderId;
};
const stopBuy = async () => {
  buyPrice = (parseFloat(soldPrice) * 1.01).toFixed(2);
  const buy = await client.marginOrder({
    symbol: "BTCUSDT",
    type: "LIMIT",
    side: "BUY",
    isIsolated: "TRUE",
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
    isolatedSymbol: "BTCUSDT",
  });
  const maxAmount = max.amount.substring(0, 7);
  console.log(`Maximum amount that can be borrowed: ${maxAmount}`);
  await client.marginLoan({
    asset: asset,
    amount: maxAmount,
    symbol: "BTCUSDT",
    isIsolated: "TRUE",
  });
  console.log(`Borrowed ${maxAmount} of ${asset} `);
};
const repayUSDT = async () => {
  const accountInfo = await client.marginIsolatedAccount({
    symbols: "BTCUSDT",
  });
  const borrowedUsdt = String(
    parseFloat(accountInfo.assets[0].quoteAsset.borrowed) +
      parseFloat(accountInfo.assets[0].quoteAsset.interest)
  ).substring(0, 9);
  await client.marginRepay({
    asset: "USDT",
    amount: borrowedUsdt,
    isIsolated: "TRUE",
    symbol: "BTCUSDT",
  });
  console.log("Paid all the borrowed USDT !!!");
};

const repayBTC = async () => {
  const accountInfo = await client.marginIsolatedAccount({
    symbols: "BTCUSDT",
  });
  const borrowedBTC = String(
    parseFloat(accountInfo.assets[0].baseAsset.borrowed) +
      parseFloat(accountInfo.assets[0].baseAsset.interest)
  ).substring(0, 7);
  await client.marginRepay({
    asset: "BTC",
    amount: borrowedBTC,
    isIsolated: "TRUE",
    symbol: "BTCUSDT",
  });
  console.log("Paid all the borrowed BTC !!!");
};

const getCurrentPrice = async () => {
  const currentPriceObj = await client.prices({ symbol: "BTCUSDT" });
  return currentPriceObj.BTCUSDT.substring(0, 8);
};

module.exports = {
  long,
  short,
  borrow,
  getCurrentPrice,
  repayUSDT,
  repayBTC,
  getID,
  getPrices,
  profitSell,
  stopSell,
  profitBuy,
  stopBuy,
};
