import express from 'express';
import dotenv from 'dotenv';

import BookmarkHandler from "./handlers/bookmarks";

dotenv.config();

// Initialize server
const app = express();
const SERVER_PORT = process.env.SERVER_PORT;

// Initialize handlers
const bookmarkHandler = new BookmarkHandler();

// Bind routes to handlers
app.get('/', (req, res) => {
    res.send('Hi!');
});

app.get('/bookmarks', bookmarkHandler.getBookmarks);

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The application is listening on port http://localhost:${SERVER_PORT}`);
});
