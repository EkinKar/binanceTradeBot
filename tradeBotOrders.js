const Binance = require("binance-api-node").default;
require("dotenv").config();
let soldPrice;
let boughtPrice;
let ocoBuyID;
let ocoSellID;
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
  await ocoSell();
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
  await ocoBuy();
};

//places an oco order
const ocoBuy = async () => {
  buyPrice = (parseFloat(soldPrice) * 0.9998).toFixed(2);
  console.log(soldPrice);
  buyStopPrice = (parseFloat(soldPrice) * 1.001).toFixed(2);
  let buyStopLimit = String(parseFloat(buyStopPrice) + 10).substring(0, 8);
  let res = await client.marginOrderOco({
    symbol: "BTCUSDT",
    type: "LIMIT",
    price: buyPrice,
    side: "BUY",
    quantity: BTCQuantity,
    stopPrice: buyStopPrice,
    stopLimitPrice: buyStopLimit,
  });
  ocoBuyID = res.orderReports.find(
    (order) => order.type === "LIMIT_MAKER"
  ).orderId;
};

//places an oco order
const ocoSell = async () => {
  sellPrice = (parseFloat(boughtPrice) * 1.0002).toFixed(2);
  sellStopPrice = (parseFloat(boughtPrice) * 0.999).toFixed(2);
  let sellStopLimit = String(parseFloat(sellStopPrice) - 10).substring(0, 8);
  let res = await client.marginOrderOco({
    symbol: "BTCUSDT",
    type: "LIMIT",
    price: sellPrice,
    side: "SELL",
    quantity: USDTQuantity,
    stopPrice: sellStopPrice,
    stopLimitPrice: sellStopLimit,
  });
  ocoSellID = res.orderReports.find(
    (order) => order.type === "LIMIT_MAKER"
  ).orderId;
};

const getOcoID = function () {
  return { ocoBuyID, ocoSellID };
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
  getOcoID,
  getPrices,
};
