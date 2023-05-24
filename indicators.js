const Binance = require("binance-api-node").default;
require("dotenv").config();
var MACD = require("technicalindicators").MACD;
const RSI = require("technicalindicators").RSI;
const calculateEma = require("indicatorts").ema;
const ADX = require("technicalindicators").ADX;

const client = Binance({
  apiKey: process.env.API,
  apiSecret: process.env.SECRET,
});

// change the interval for different candle data
const indicators = async () => {
  const candles = await client.candles({
    symbol: "BTCUSDT",
    interval: "1m",
    limit: 1000,
  });
  const closingPrices = candles.map((candle) => parseFloat(candle.close));
  const high = candles.map((candle) => parseFloat(candle.high));
  const low = candles.map((candle) => parseFloat(candle.low));

  //MACD indicator
  const macdInput = {
    values: closingPrices,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };
  const macdOutput = MACD.calculate(macdInput);
  const [macd1, macd2, macd3] = macdOutput
    .slice(-4)
    .map((output) => output.histogram);

  //RSI indicator
  const rsiInput = {
    values: closingPrices,
    period: 14,
  };
  const rsiOutput = RSI.calculate(rsiInput);
  const [rsi1, rsi2, rsi3] = rsiOutput.slice(-4);

  //EMA indicator
  const ema = calculateEma(200, closingPrices).slice(-4);
  const [ema1, ema2, ema3] = ema;
  const adxInput = {
    high: high,
    low: low,
    close: closingPrices,
    period: 14,
  };

  //ADX indicator
  const calcadx = ADX.calculate(adxInput)
    .slice(-4)
    .map((out) => out.adx);
  const [adx1, adx2, adx3] = calcadx;

  const lastCandles = candles.slice(-4);
  const [candle1, candle2, candle3] = lastCandles;
  candle1.rsi = rsi1;
  candle2.rsi = rsi2;
  candle3.rsi = rsi3;
  candle1.macd = macd1;
  candle2.macd = macd2;
  candle3.macd = macd3;
  candle1.ema = ema1;
  candle2.ema = ema2;
  candle3.ema = ema3;
  candle1.adx = adx1;
  candle2.adx = adx2;
  candle3.adx = adx3;
  return { candle1, candle2, candle3 };
};

module.exports = indicators;
