// High level imports.
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const bluebird = require("bluebird");
const redis = require("redis");
const amqp = require("amqplib");
const mongoose = require("mongoose");

const api = require("./api/api");
require("./models/searchResult");

const app = express();
console.log(process.env.REDIS_URL, process.env.QUEUE_URL, process.env.DB_URL, process.env.QUEUE_NAME);
// Connect the requisites.
const redisClient = redis.createClient(process.env.REDIS_URL);
const queue = amqp.connect(process.env.QUEUE_URL);
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });
redisClient.on("connect", () => {
  console.log("Connected to Redis.");
});

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

app.set("port", process.env.PORT || 3000);

app.use(bodyParser.json());

// Registering the routes.
app.use(
  "/api",
  (req, res, next) => {
    req.redisClient = redisClient;
    req.queue = queue;
    next();
  },
  api
);

app.get("/", (req, res) => {
  res.end();
});

app.listen(app.get("port"), () => {
  console.log(`Server started at port ${app.get("port")}.`);
});
