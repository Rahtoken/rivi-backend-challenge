# Rivi Backend Engineering Internship Challenge

By Rohan Ankarigari Boda, rohan.ankb@gmail.com.

## The Challenge

A search service which allows the user to create new searches and check on the status of their searches.
The searches should be processed asynchronously and not block the backend service.

## The Approach

I identified this as a pattern for asynchronous messaging and went ahead with a "Work Queue" approach.

The backend service takes the user's search request and publishes it to a work queue, this allows the processing to be independent of the request handling.

Another service, the worker service, runs parallelly and monitors the queue for any work items. If it finds any work items, it asynchronously processes them.

Thus, the request handling and query processing are independent of each other. This approach also allows for scaling of the query processing by adding more worker instances.

## Tech Stack

- NodeJS: Powers both the backend service and the worker service.
- ExpressJS: The framework opted for the backend service.
- MongoDB: The database where the data is stored.
- Redis: To monitor the status of the query.
- RabbitMQ: The message broker used for the queue.

## The Flow

1. The users makes a POST request to the search endpoint.
2. The backend service receives this request, hashes it, sets its' status as STARTED in the Redis database, and sends the message to the queue.
3. The worker service retrieves the message from the queue and starts processing it.
4. The user makes a GET request with the searchId to the ping endpoint.
5. If the worker has finished processing the query, it will set the request status as COMPLETED in the Redis database and upload the data to the MongoDB database.
6. The ping route in the backend checks the status of the request. If it is COMPLETED, it pulls the data from the MongoDB database and sends the result. Otherwise, it tells the user that their query is being processed.

## Running

The easiest way to run and test the project is to run `docker-compose up` in the root directory. However, the RabbitMQ server takes time to start. These set of commands ensure proper setup (sudo access may be required):

1. `docker-compose run --rm start_deps`
2. Wait for the above command to stop.
3. `docker-compose up`

Use Postman or Curl to test the endpoints.
Sample commands:

1. `curl -H "Content-Type: application/json" --request POST --data '{"from": "DELHI", "to": "HYD"}' localhost:3000/api/search` (on Linux systems).
2. Copy the searchId from the above request.
3. `curl localhost:3000/api/ping/{searchId}`
