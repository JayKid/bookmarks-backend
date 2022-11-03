import { Knex } from "knex";
import { User } from "../../interfaces/User";
import { v4 as uuidv4 } from "uuid";
import { UserAlreadyExistsError, UserError } from "../../errors";

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
                id: uuidv4(),
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
            const result = this.getTable().where('email', email);
            // @ts-ignore
            if (result.length !== 1) {
                return new UserError("There was an error retrieving the user");
            }
            // @ts-ignore
            return result[0];
        }
        catch (err) {
            return new UserError("There was an error retrieving the user");
        }
    }
}