import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { knex as KnexFactory } from "knex";

import BookmarksHandler from './handlers/Bookmarks';
import BookmarksService from './services/Bookmarks';
import BookmarksStore from './stores/Bookmarks';
import appConfig from '../config';

dotenv.config();

// Initialize server
const app = express();
const SERVER_PORT = process.env.SERVER_PORT;
app.use(bodyParser.json());

// Initialize DB
const database = KnexFactory({
    client: "pg",
    connection: appConfig.knex,
    migrations: {
        tableName: 'knex_migrations'
    }
});

// Initialize stores
const bookmarksStore = new BookmarksStore(database);

// Initialize services
const bookmarksService = new BookmarksService(bookmarksStore);

// Initialize handlers
const bookmarksHandler = new BookmarksHandler(bookmarksService);

// Bind routes to handlers
app.get('/bookmarks', bookmarksHandler.getBookmarks);
app.post('/bookmark', bookmarksHandler.addBookmark);

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The application is listening on port http://localhost:${SERVER_PORT}`);
});
