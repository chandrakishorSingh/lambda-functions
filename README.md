# About
This was a team project of our final year Bachelor in Computer Engineering degree(B.E. Computer Engineering) from Mumbai University.

Our aim was to build a simple but effective system which will analyze the stock prices of Nifty 50 companies using technical indicators. Depending upon the result of technical indicators, the system will generate buy/sell signal. This signal will be visible to end users who can then place a buy/sell order. We have chosen the Stochastic RSI technical indicator for determining the time to buy/sell a stock.

The UI of the app is basically a clone of [Upstox](https://play.google.com/store/apps/details?id=in.upstox.pro&hl=en_IN).

# NOTE
This repository only contains backend code. For the client android app [click here](https://github.com/chandrakishorSingh/market-pulse-v2)

# Working
We get the closing stock prices of all Nifty 50 companies at 5:30 PM. This data(along with previously stored prices) is analyzed using Stochastic RSI which generates the buy/sell signal. The users can then place buy/sell orders for the stocks for which signals have been generated. The user can only place an order between 7PM to 8AM(of next day). We are assuming that this order will be a limit order.

# Technologies

## Backend
AWS
  - Lambda : for handling API request from client, generating signals, interacting with database etc.
  - DynamoDB : for storing various data like user, stock, siganl etc.
  - API Gateway : for creating REST APIs
  - Cognito : for signup, signin of users
  - Cloud Watch : for scheduling various tasks like getting stock prices, generating the signal, deleting old data
  
Alphavantage : third party API service for getting daily stock prices

## Frontend
Ionic : for pre styled UI component

Angular : for creating the web app

Apache Cordova & Android Studio : for transforming the web app to an android app

# Visual Demo

1. Watchlist

<img src="https://github.com/chandrakishorSingh/market-pulse-v2/blob/master/demo/watchlist.gif" width="300">

2. Portfolio

<img src="https://github.com/chandrakishorSingh/market-pulse-v2/blob/master/demo/portfolio.gif" width="300">

3. Trades

<img src="https://github.com/chandrakishorSingh/market-pulse-v2/blob/master/demo/trades.gif" width="300">

4. Placing an order

<img src="https://github.com/chandrakishorSingh/market-pulse-v2/blob/master/demo/transaction.gif" width="300">

5. Funds

<img src="https://github.com/chandrakishorSingh/market-pulse-v2/blob/master/demo/funds.gif" width="300">

# Useful Links

1. [Android Client Repository](https://github.com/chandrakishorSingh/market-pulse-v2)
