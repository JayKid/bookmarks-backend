import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

import UsersStore from "../../stores/Users";
import { HashingError, UserAlreadyExistsError, UserError } from "../../errors";

export default class UsersService {
    private usersStore: UsersStore;

    public constructor(usersStore: UsersStore) {
        this.usersStore = usersStore;
    }

    public signup = async (email: string, password: string): Promise<{ id: string, email: string } | HashingError | UserAlreadyExistsError | UserError> => {
        const salt = randomBytes(16);
        const hashedPasswordBuffer = pbkdf2Sync(password, salt, 310000, 32, 'sha256');
        if (hashedPasswordBuffer instanceof Error) {
            return new HashingError("There was an error encoding the password");
        }
        const hashedPassword = hashedPasswordBuffer.toString();
        const result = this.usersStore.signup({ email, hashedPassword, salt: salt.toString() });
        return result;
    };

    public getUserByEmail = async (email: string, password: string) => {
        const userRow = await this.usersStore.getUserByEmail(email);
        if (userRow instanceof UserError) {
            return userRow;
        }

        const hashedPasswordBuffer = pbkdf2Sync(password, userRow.salt, 310000, 32, 'sha256');
        if (hashedPasswordBuffer instanceof Error) {
            return new HashingError("There was an error encoding the password");
        }

        if (!timingSafeEqual(Buffer.from(userRow.hashed_password), hashedPasswordBuffer)) {
            return new UserError("There was an error retrieving the user");
        }
    }
};
