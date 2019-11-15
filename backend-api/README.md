# Backend API Service #

This service exposes two API endpoints which lets the user make new queries and ping existing ones.

## Endpoints ##

- `POST /api/search`: Create a new query from the contents of the request body. The query is processed by a worker service. Returns the query identifier.
- `GET /api/ping/{queryId}`: Get the status of the query specified by the `queryId`. Returns the status and result of the query.
