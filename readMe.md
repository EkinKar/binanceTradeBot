# Eko Trading Bot

This project consists of a trading bot that allows automated trading on the Cross Margin market on Binance. The main script, tradeBot.js, provides a fully automated trading experience based on predefined conditions and indicators. It also includes additional scripts for manual trading on both Cross Margin and Isolated Margin markets.

# Features

1. `tradeBot.js`: This script is designed to automate trading on the Cross Margin market.
   It leverages four indicators defined in the indicators.js file to set conditions for placing long or short positions.
   Once the specified conditions are met, the bot proceeds with the following steps:

- Borrow the maximum amount that can be borrowed based on the available funds.

- Place a market buy (or sell) order to open the position.

- Set an Oco (One Cancels the Other) order to close the position when the price reaches either the stop or limit price.

- Automatically pay back the borrowed funds.

- Repeat the process to initiate a new trade.

The use of an Oco order allows for the simultaneous placement of a stop and limit order, providing additional flexibility in managing positions and reducing risks.

2. `crossManual.js`: The script enables manual trading on the Cross Margin market on Binance. With this script, you can manually place long and short positions, set profit targets, and define stop-loss levels.

To use the `crossManual.js` script, follow these steps:

- Run the script using Node.js by executing the command `node crossManual.js`.

- The script will wait for your input. Press the designated key (default is "a") to trigger a long position. The script will borrow the maximum amount available and place a market buy order.

- To close the position, you can press another key (default is "s") to place an order at a price 1/1000 higher than the buy price, or press a different key (default is "d") to place an order at a price 10% lower than the buy price.

- Once the sell order is filled, the script will automatically repay the borrowings, allowing you to place a new order.

3. `isolatedManual.js`: Similar to crossManual.js, this script enables manual trading on the Isolated Margin market. The functionality is the same, but it operates on the Isolated Margin market instead of Cross Margin.

4. `isolatedOcoTrade.js`: This script allows you to place Isolated Margin orders with fixed stop and limit prices. It includes automatic borrowing and repayment of funds, similar to the other scripts.

# Prerequisites

Node.js and npm installed on your machine.
Binance API key and secret. You can obtain these from your Binance account.

# Setup

Clone the repository and navigate to the project directory.
Install the dependencies by running the command: npm install.
Create a .env file and add your Binance API key and secret.
Adjust the key bindings and other parameters in the scripts according to your preferences.
Run the desired script using the command: node <script_name>.js.

# Disclaimer

<strong> Important: All code is my own work and it only belongs to me. </strong>

This project was initially developed for personal use, and I didn't plan to publish it when I started working on it a few months ago. However, I have now decided to share it with others so that they can also benefit from it.

Please note that cryptocurrency trading involves inherent risks, and the use of trading bots can introduce additional complexities. I strongly advise you to thoroughly understand the risks and exercise caution when using this bot or any other trading software. The code provided in this repository serves as an example and should be modified and used at your own discretion.
