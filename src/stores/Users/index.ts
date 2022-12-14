import { Knex } from "knex";
import { User } from "../../interfaces/User";
import { UserAlreadyExistsError, UserError } from "../../errors";
import { randomUUID } from "crypto";

export default class UsersStore {
    private database: Knex;
    private readonly TABLE_NAME = "users";

    public constructor(db: Knex) {
        this.database = db;
    }

    private getTable(): Knex.QueryBuilder<User, User[]> {
        return this.database<User, User[]>(this.TABLE_NAME);
    }

    public signup = async ({ email, hashedPassword, salt }: { email: string, hashedPassword: string, salt: string }) => {
        try {
            const user = await this.getTable().insert({
                id: randomUUID(),
                email,
                hashed_password: hashedPassword,
                salt,
            }).returning('id');
            return {
                id: user[0].id,
                email,
            };
        } catch (err) {
            //@ts-ignore
            if (err?.constraint === 'users_email_unique') {
                return new UserAlreadyExistsError("A user with this email already exists");
            }
            return new UserError("There was an error creating the user");
        }
    }

    public getUserByEmail = async (email: string): Promise<User | UserError> => {
        try {
            const result = await this.getTable().where('email', email).first();
            if (!result) {
                return new UserError("There was an error retrieving the user");
            }
            return result;
        }
        catch (err) {
            return new UserError("There was an error retrieving the user");
        }
    }
}