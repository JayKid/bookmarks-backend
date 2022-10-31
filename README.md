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