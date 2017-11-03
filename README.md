# CryptoGive Token App

CryptoGive is the missing link between cryptocurrency and charitable giving. Bitcoin and cryptocurrencies like it are growing at an exponential rate but charitable organizations lack the technology, confidence, and understanding to accept cryptocurrency as payment. At CryptoGive our mission is to use this new form of currency for good. The annual market size of charitable giving totals to over $398 billion in the United States alone. We work with two market leaders, OrgHunter and MakeMyDonation, to provide an easy platform for cryptocurrency users to donate. Through this partnership, this groundbreaking application will instantly expose 1.5 million US-based charities to an untapped revenue source and will ever-change crypto’s role in the vast world of philanthropy. Our goal is to create a positive image for cryptocurrency.

This repo helps you build a [Token app](https://www.tokenbrowser.com) in Javascript.

The sample bot can:

* send messages
* send and request money
* create simple UI for buttons and menus
* store sessions and state for each user

TODO

* sending image messages
* creating web view UIs

## Launch your own Token app in 5 minutes

Read our [guide to creating a Token app](http://developers.tokenbrowser.com/docs/creating-a-token-app).

When ready, fork this repo and deploy it to Heroku.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Then check out [`src/bot.js`](src/bot.js) to start changing the bot logic.

## Running locally with Docker

You can run the project locally with

```
docker-compose up
```

If any new depencies are added you can rebuild the project with

```
docker-compose build
```

To reset the postgres database in your dev environment you can use

```
docker-compose down -v
```

## Architecture

Deploying a Token app requires a few processes to run:

* **token-headless-client**<br>
  This is a client we provide (similar to the iOS or Android client) that provides a wrapper around the Token backend services. It also handles end-to-end encrypting all messages using the Signal protocol. It is written in Java and runs in the background, proxying all the requests to amd from your bot.
* **redis**<br>
  We use redis pub/sub to provide a connection between the token-headless-client and your bot.
* **bot.js**<br>
  This is where all your app logic lives.
* **postgres**<br>
  Postgres is used to store session data so you can persist state for each user who talks to your bot (similar to cookies in a web browser).

![diagram](docs/images/app-architecture.png)

## See also

* [https://www.tokenbrowser.com]
