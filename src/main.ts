import express from 'express';
import dotenv from 'dotenv';
import { knex as KnexFactory } from "knex";

import BookmarksHandler from "./handlers/bookmarks";
import BookmarksService from './services/bookmarks';
import BookmarksStore from './stores/bookmarks';
import appConfig from '../config';

dotenv.config();

// Initialize server
const app = express();
const SERVER_PORT = process.env.SERVER_PORT;

// Initialize DB
const database = KnexFactory({
    client: "pg",
    connection: appConfig.knex,
    migrations: {
        tableName: 'migrations'
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

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The application is listening on port http://localhost:${SERVER_PORT}`);
});
