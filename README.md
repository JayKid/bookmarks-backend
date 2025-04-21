# Bookmarks backend

## Motivation

I am currently running Nextcloud self-hosted, but I am on the process of replacing it with TrueNAS Core.

However, I've grown accustomed to using a couple of apps within Nextcloud, one of them being Nextcloud Bookmarks.

After looking around and not being convinced with any of the existing OSS solutions, I decided the scope is small enough to warrant me writing my own little server that I could self-host too.

## Running the server locally

### Database

#### Running

##### Development Mode
To run the application in development mode (includes Adminer interface):
```bash
# Start all services including Adminer
docker-compose --profile dev up
```

##### Production Mode
To run the application in production mode (without Adminer):
```bash
# Start only the necessary services
docker-compose --profile prod up
```

The services will start in the following order:
1. Database (PostgreSQL)
2. Migrations (runs database schema setup)
3. Backend server
4. Adminer (development mode only)

You can access:
- Adminer UI via `http://localhost:8080` (development only)
- Backend API via `http://localhost:${SERVER_PORT:-3000}`
- Database on the default PostgreSQL port `5432`

##### Running Migrations Manually
If you need to run migrations manually:
```bash
# Development
docker-compose --profile dev run migrations

# Production
docker-compose --profile prod run migrations
```

The services can be configured using environment variables:
- `DB_USER`: Database user (default: bookmarks-admin)
- `DB_PASSWORD`: Database password (default: bookmarks-password)
- `DB_NAME`: Database name (default: bookmarks-db)
- `SERVER_PORT`: Backend server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

You can set these variables in your shell before running docker-compose, or create a `.env` file in the project root. For example:
```bash
export DB_USER=myuser
export DB_PASSWORD=mypassword
export DB_NAME=mydb
export SERVER_PORT=3001
export NODE_ENV=production
```

These same values will need to be set in your application's `.env` file for the server to connect to the database.

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

### Key Endpoints

The API provides endpoints for:
- User authentication (signup, login, logout)
- Bookmark management (CRUD operations)
- Label management (CRUD operations)
- Bookmark-Label relationship management

All authenticated endpoints require a valid session cookie (`connect.sid`).