require("dotenv").config();
console.log(process.env.REDIS_URL, process.env.QUEUE_URL, process.env.DB_URL, process.env.QUEUE_NAME);
const workQueue = require("amqplib").connect(process.env.QUEUE_URL);
const redis = require("redis");
const mongoose = require("mongoose");

const SearchResult = require("./models/searchResult");
const queueName = process.env.QUEUE_NAME;
let redisClient;
redisClient = redis.createClient(process.env.REDIS_URL);

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true });

let queueChannel;


function doWork(workAmount) {
  return new Promise(resolve => setTimeout(resolve, workAmount));
}

workQueue
  .then(function(conn) {
    if (queueChannel == null) {
      queueChannel = conn.createChannel();
    }
    return queueChannel;
  })
  .then(channel => {
    return channel.assertQueue(queueName).then(Ok => {
      return channel.consume(queueName, async message => {
        if (message !== null) {
          await doWork(15000);
          let content = JSON.parse(message.content.toString());
          let searchResult = new SearchResult({
            ...content
          });
          searchResult.save(async (err, result) => {
            if (err) {
              console.err(err);
            }
            redisClient.set(content.searchId, "COMPLETED");
            channel.ack(message);
          });
        }
      });
    });
  })
  .catch(console.warn);
