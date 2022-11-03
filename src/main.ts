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
import appConfig from '../config';
import UsersStore from './stores/Users';
import UsersService from './services/Users';
import UsersHandler from './handlers/Users';
import { exit } from 'process';

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

// Initialize services
const usersService = new UsersService(usersStore);
const bookmarksService = new BookmarksService(bookmarksStore);

// Initialize handlers
const usersHandler = new UsersHandler(usersService, passport);
const bookmarksHandler = new BookmarksHandler(bookmarksService);

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

passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password",
}, (email, password, cb) => {
    const user = usersService.getUserByEmail(email, password);
    if (user instanceof Error) {
        return cb(user);
    }
    cb(null, user);
}));
passport.serializeUser((user, done) => {
    done(undefined, user);
});

passport.deserializeUser((user: any, done) => {
    done(undefined, user);
});

// Bind routes to handlers
app.post('/login', usersHandler.login);
app.post('/signup', usersHandler.signup);
app.post('/logout', passport.authenticate('session'), usersHandler.verifyLoggedIn, usersHandler.logout);

app.get('/bookmarks', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.getBookmarks);
app.post('/bookmark', passport.authenticate('session'), usersHandler.verifyLoggedIn, bookmarksHandler.addBookmark);

// Start server
app.listen(SERVER_PORT, () => {
    console.log(`The application is listening on port http://localhost:${SERVER_PORT}`);
});
