# Bookmarks Backend

This is a backend API for managing bookmarks with labels and thumbnail support.

## Features

- User authentication (login/signup)
- Create, read, update, delete bookmarks
- Add/remove labels to bookmarks
- Create, read, update, delete lists
- Add/remove bookmarks to lists
- Automatic thumbnail extraction from bookmarked webpages

## Thumbnail Functionality

The system automatically extracts thumbnail images for bookmarks:

1. When a user creates a bookmark without providing a thumbnail URL, the system adds the bookmark to the database with a `null` thumbnail.
2. Simultaneously, an asynchronous job is queued to fetch the webpage content and extract a suitable thumbnail URL.
3. The job looks for common meta tags that contain image URLs, such as:
   - Open Graph (`og:image`)
   - Twitter Card (`twitter:image`)
   - Link with `rel="image_src"`
   - Article image (`article:image`)
4. If a suitable image URL is found, the bookmark record is updated in the database.
5. The next time the client fetches the bookmark, the thumbnail URL will be included in the response.

This approach ensures that:
- Bookmark creation is fast and not blocked by the thumbnail extraction process
- Thumbnails are extracted in the background without affecting the user experience
- If thumbnail extraction fails, the bookmark still exists with a `null` thumbnail value

## Setup

### Prerequisites

- Node.js
- PostgreSQL
- Redis (for job queue)

### Environment Variables

Create a `.env` file with the following variables:

```
NODE_ENV=development
DB_HOST=localhost
DB_NAME=bookmarks
DB_USER=postgres
DB_PASSWORD=yourpassword
SERVER_PORT=3000
SESSION_SECRET=yoursecret
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Run migrations:
   ```
   npm run migrate
   ```

3. Start the server:
   ```
   npm start
   ```

### Docker

To run with Docker:

```
docker-compose up
```

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
- Backend API via `http://localhost:${SERVER_PORT}`
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
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `SERVER_PORT`: Backend server port
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

All authenticated endpoints require a valid session cookie (`connect.sid`).