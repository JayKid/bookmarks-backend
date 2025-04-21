# Bookmarks backend

## Motivation

I am currently running Nextcloud self-hosted, but I am on the process of replacing it with TrueNAS Core.

However, I've grown accustomed to using a couple of apps within Nextcloud, one of them being Nextcloud Bookmarks.

After looking around and not being convinced with any of the existing OSS solutions, I decided the scope is small enough to warrant me writing my own little server that I could self-host too.

## Running the server locally

### Database

#### Running

+ `docker-compose up` will spin up a PostgreSQL instance and an `adminer` frontend to easily interact with it via UI.

You can access this UI via `http://localhost:8080` and the DB on the default PostgreSQL port `5432`

All credentials for the database are by now hardcoded in `docker-compose.yaml`. You will need these values in your `.env` file too. 

In order to create and populate your own `.env` file, duplicate the `.env-example` file present at the root of the repo and replace the DB variables with your desired values.

#### Seeding and running migrations

+ `npm run migrate` will seed the database and run all existing migrations. You will need to run this command the first time you are running the database.

### Application server

+ `npm start` will give you a nodemon process watching the TS files and running the node server on the port specified by `SERVER_PORT` on your `.env` file.

+ `npm run test` will run the Jest tests available.

## API Documentation

The API is documented using the OpenAPI 3.1.1 specification. You can find the complete API documentation in the `spec/openapi.yaml` file. This specification includes:

- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Error handling

You can use this specification with tools like [Swagger UI](https://swagger.io/tools/swagger-ui/) to:
- Explore the API interactively
- Test endpoints
- Generate client SDKs
- Generate API documentation

### Key Endpoints

The API provides endpoints for:
- User authentication (signup, login, logout)
- Bookmark management (CRUD operations)
- Label management (CRUD operations)
- Bookmark-Label relationship management

All authenticated endpoints require a valid session cookie (`connect.sid`).