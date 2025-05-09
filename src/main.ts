import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { knex as KnexFactory } from "knex";

import BookmarksHandler from './handlers/Bookmarks';
import BookmarksService from './services/Bookmarks';
import BookmarksStore from './stores/Bookmarks';
import appConfig from './config';
import UsersStore from './stores/Users';
import UsersService from './services/Users';
import UsersHandler from './handlers/Users';
import ListsStore from './stores/Lists';
import ListsService from './services/Lists';
import ListsHandler from './handlers/Lists';
import LabelsStore from './stores/Labels';
import LabelsService from './services/Labels';
import LabelsHandler from './handlers/Labels';
import { exit } from 'process';
import ThumbnailWorker from './jobs/thumbnailWorker';
import TitleWorker from './jobs/titleWorker';
import ImportExportHandler from './handlers/ImportExport';

dotenv.config();

// Initialize DB
const database = KnexFactory({
    client: "pg",
    connection: appConfig.knex,
    migrations: {
        tableName: 'knex_migrations'
    }
});

// Initialize stores
const usersStore = new UsersStore(database);
const bookmarksStore = new BookmarksStore(database);
const labelsStore = new LabelsStore(database);
const listsStore = new ListsStore(database);
// Initialize services
const usersService = new UsersService(usersStore);
const bookmarksService = new BookmarksService(bookmarksStore);
const labelsService = new LabelsService(labelsStore);
const listsService = new ListsService(listsStore);
// Initialize handlers
const usersHandler = new UsersHandler(usersService, passport);
const bookmarksHandler = new BookmarksHandler(bookmarksService, labelsService);
const labelsHandler = new LabelsHandler(labelsService);
const listsHandler = new ListsHandler(listsService);
const importExportHandler = new ImportExportHandler(bookmarksService, labelsService, listsService);

// Initialize thumbnail and title workers only when not in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';
if (!isTestEnvironment) {
    const thumbnailWorker = new ThumbnailWorker(database);
    const titleWorker = new TitleWorker(database);
}

// Initialize server
const app = express();
const SERVER_PORT = process.env.SERVER_PORT;
app.use(bodyParser.json());
if (!process.env.SESSION_SECRET) {
    console.error("Please provide a session secret via the .env file");
    exit(1);
}
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
}, async (email, password, cb) => {
    const user = await usersService.getUserByEmail(email, password);
    if (user instanceof Error) {
        return cb(user);
    }
    cb(null, {
        id: user.id,
        email: user.email
    });
}));

passport.serializeUser((user, done) => {
    done(undefined, user);
});

passport.deserializeUser((user: { id: string, email: string }, done) => {
    done(undefined, user);
});

// Bind routes to handlers
app.post('/login', usersHandler.login);
app.post('/signup', usersHandler.signup);
app.post('/logout', passport.authenticate('session'), usersHandler.verifyLoggedIn, usersHandler.logout);

app.get('/user', passport.authenticate('session'), usersHandler.verifyLoggedIn, usersHandler.getUser)

app.get('/bookmarks', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.getBookmarks);
app.post('/bookmarks', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.addBookmark);
app.put('/bookmarks/:bookmarkId', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.updateBookmark);
app.delete('/bookmarks/:bookmarkId', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.deleteBookmark);
app.post('/bookmarks/:bookmarkId/labels/:labelId', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.addLabelToBookmark);
app.delete('/bookmarks/:bookmarkId/labels/:labelId', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.removeLabelFromBookmark);

app.get('/labels', passport.authenticate('session'), usersHandler.verifyLoggedIn, labelsHandler.getLabels);
app.post('/labels', passport.authenticate('session'), usersHandler.verifyLoggedIn, labelsHandler.createLabel);
app.put('/labels/:labelId', passport.authenticate('session'), usersHandler.verifyLoggedIn, labelsHandler.updateLabel);
app.delete('/labels/:labelId', passport.authenticate('session'), usersHandler.verifyLoggedIn, labelsHandler.deleteLabel);

// Lists routes
app.get("/lists", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.getLists);
app.post("/lists", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.createList);
app.get("/lists/:listId", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.getList);
app.put("/lists/:listId", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.updateList);
app.delete("/lists/:listId", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.deleteList);
app.post("/lists/:listId/bookmarks", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.addBookmarkToList);
app.delete("/lists/:listId/bookmarks/:bookmarkId", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.removeBookmarkFromList);
app.get("/lists/:listId/bookmarks", passport.authenticate('session'), usersHandler.verifyLoggedIn, listsHandler.getBookmarksInList);

// Import/Export routes
app.get("/export", passport.authenticate('session'), usersHandler.verifyLoggedIn, importExportHandler.exportUserData);
app.post("/import", passport.authenticate('session'), usersHandler.verifyLoggedIn, importExportHandler.importUserData);

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The application is listening on port http://localhost:${SERVER_PORT}`);
});
