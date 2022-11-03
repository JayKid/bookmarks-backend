import { NextFunction, Request, Response } from "express";
import { PassportStatic } from "passport";
import { HashingError, UserAlreadyExistsError, UserError } from "../../errors";

import UsersService from "../../services/Users";

export default class UsersHandler {

    private userService;
    private passport;

    public constructor(userService: UsersService, passport: PassportStatic) {
        this.userService = userService;
        this.passport = passport;
    }

    public signup = async (req: Request, res: Response) => {
        // Check ENV gate
        if (!process.env.SIGNUPS_ENABLED || process.env.SIGNUPS_ENABLED === "false") {
            return res.status(403).json({
                error: {
                    type: "signups-disabled",
                    message: "Signups are disabled"
                }
            });
        }
        // Validate input
        if (!req.body?.email) {
            return res.status(400).json({
                error: {
                    type: "missing-email",
                    message: "missing email"
                }
            });
        }
        if (!this.isValidEmail(req.body.email)) {
            return res.status(400).json({
                error: {
                    type: "invalid-email",
                    message: "invalid email provided",
                }
            });
        }
        if (!req.body?.password) {
            return res.status(400).json({
                error: {
                    type: "missing-password",
                    message: "missing password"
                }
            });
        }
        if (!this.isValidPassword(req.body.password)) {
            return res.status(400).json({
                error: {
                    type: "invalid-password",
                    message: "invalid password provided",
                }
            });
        }

        // Create user
        const { email, password } = req.body;
        const user = await this.userService.signup(email, password);

        // Deal with errors if needed
        if (user instanceof HashingError) {
            return res.status(400).json({
                error: {
                    type: "password-error",
                    message: user.errorMessage,
                }
            });
        }
        if (user instanceof UserAlreadyExistsError) {
            return res.status(400).json({
                error: {
                    type: "user-exists-error",
                    message: user.errorMessage,
                }
            });
        }
        if (user instanceof UserError) {
            return res.status(500).json({
                error: {
                    type: "user-error",
                    message: user.errorMessage,
                }
            });
        }

        req.login(user, function (err) {
            if (err) {
                return res.status(500).json({
                    error: {
                        type: "login-error",
                        message: "There was an unknown error while logging in",
                    }
                });
            }
            return res.status(200).send({ user });
        });
    }

    public login = async (req: Request, res: Response) => {
        return await this.passport.authenticate('local', (err, user) => {
            if (err) {
                return res.sendStatus(400);
            }

            if (user) {
                return req.logIn(user, (error) => {
                    if (error) {
                        return res.sendStatus(400);
                    }
                    return res.sendStatus(200);
                });
            }

            return res.sendStatus(400);
        })(req, res);
    }

    public logout = (req: Request, res: Response) => {
        req.logout(function (err) {
            if (err) {
                return res.sendStatus(400);
            }
            return res.sendStatus(200);
        });
    }

    public verifyLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(400).json({
                error: {
                    type: "not-logged-in",
                    message: "Missing or wrong credentials provided"
                }
            });
        }
        return next();
    }

    private isValidEmail(email: string): boolean {
        // From MDN: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#basic_validation
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
    }

    private isValidPassword(password: string): boolean {
        if (password.length < 8) {
            return false
        }
        return true;
    }
}