require("dotenv").config();

const express = require("express");
const crypto = require("crypto");

const SearchResult = require("../models/searchResult");

const router = express.Router();
const queueName = process.env.QUEUE_NAME;

let queueChannel;

const hashSearchQuery = searchQuery => {
  let timestamp = Date.now()
    .valueOf()
    .toString();
  return crypto
    .createHash("SHA1")
    .update(`${searchQuery.from}${searchQuery.to}${timestamp}`)
    .digest("hex");
};

router.post("/search", (req, res) => {
  let searchQuery = {
    from: req.body.from,
    to: req.body.to
  };

  if (!searchQuery.from || !searchQuery.to) {
    // Invalid request.
    res.setHeader("Status", 400);
    res.end();
  }

  // Generate hash.
  let hashedQuery = hashSearchQuery(searchQuery);

  // Set state of request.
  req.redisClient.set(hashedQuery, "STARTED");

  // Push to Queue.
  req.queue
    .then(conn => {
      if (queueChannel == null) {
        queueChannel = conn.createChannel();
      }
      return queueChannel;
    })
    .then(channel => {
      return channel.assertQueue(queueName).then(async Ok => {
        return channel.sendToQueue(
          queueName,
          Buffer.from(
            JSON.stringify({
              searchId: hashedQuery,
              ...searchQuery
            })
          )
        );
      });
    })
    .catch(console.error);

  res.setHeader("Status", 200);
  let response = {
    searchId: hashedQuery
  };
  res.json(response);
});

router.get("/ping/:query", async (req, res, next) => {
  let query = req.params.query;

  // Check the status of the search.
  let searchStatus = await req.redisClient.getAsync(query);
  let response = {
    status: "PROCESSING",
    result: {}
  };

  if (searchStatus !== "COMPLETED") {
    return res.status(202).json(response);
  }

  response.status = "COMPLETED";
  return SearchResult.findOne(
    {
      searchId: query
    },
    (err, data) => {
      if (err) {
        next(err);
      } else {
        response.result = {
          searchId: data.searchId,
          from: data.from,
          to: data.to,
          data: data.data
        };
        res.status(200).json(response);
      }
    }
  );
});

module.exports = router;
